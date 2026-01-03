#!/usr/bin/env python3

import json
import sys
from pathlib import Path
from dataclasses import dataclass

from opensearchpy import OpenSearch, helpers
import psycopg

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ELIB_PATH = BASE_DIR / "elib.jsonl"
RUSLAN_PATH = BASE_DIR / "ruslan.jsonl"

OPENSEARCH_HOST = "localhost"
OPENSEARCH_PORT = 9200
INDEX_NAME = "library_documents"

PG_DSN = "postgresql://library_user:library_password@localhost:5432/library_search"
CHUNK_SIZE = 1000


@dataclass
class LoadStats:
    total: int = 0
    success: int = 0
    failed: int = 0

    def __str__(self):
        return f"Total: {self.total}, Success: {self.success}, Failed: {self.failed}"


def create_opensearch_client():
    return OpenSearch(
        hosts=[{"host": OPENSEARCH_HOST, "port": OPENSEARCH_PORT}],
        http_compress=True,
        timeout=60,
    )


def create_index(client):
    index_settings = {
        "settings": {
            "index": {"number_of_shards": 1, "number_of_replicas": 0},
            "analysis": {
                "analyzer": {
                    "russian_analyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "russian_stemmer"],
                    }
                },
                "filter": {"russian_stemmer": {"type": "stemmer", "language": "russian"}},
            },
        },
        "mappings": {
            "dynamic": True,
            "properties": {
                "document_id": {"type": "keyword"},
                "source": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "analyzer": "russian_analyzer",
                    "fields": {"keyword": {"type": "keyword", "ignore_above": 512}},
                },
                "authors": {
                    "type": "text",
                    "analyzer": "russian_analyzer",
                    "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
                },
                "year": {"type": "integer"},
                "document_type": {"type": "keyword"},
                "subjects": {
                    "type": "text",
                    "analyzer": "russian_analyzer",
                    "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
                },
                "language": {"type": "keyword"},
                "card_url": {"type": "keyword"},
            },
        },
    }

    if client.indices.exists(index=INDEX_NAME):
        print(f"Deleting existing index '{INDEX_NAME}'...")
        client.indices.delete(index=INDEX_NAME)

    print(f"Creating index '{INDEX_NAME}'...")
    client.indices.create(index=INDEX_NAME, body=index_settings)
    print("Index created.")


def parse_elib_document(raw):
    record_key = raw.get("record_key", "")
    doc_id = record_key.replace("\\", "_") if record_key else f"elib_{hash(raw.get('title', ''))}"

    authors = raw.get("authors", [])
    if isinstance(authors, str):
        authors = [authors]

    subjects = raw.get("subjects", [])
    if isinstance(subjects, str):
        subjects = [subjects]

    doc = {"document_id": doc_id, **raw}
    doc["authors"] = authors
    doc["subjects"] = subjects
    return doc


def parse_ruslan_document(raw):
    authors = raw.get("authors", [])
    if isinstance(authors, str):
        authors = [authors]

    subjects = raw.get("subjects", raw.get("subject_term", []))
    if isinstance(subjects, str):
        subjects = [s.strip() for s in subjects.replace(",", " ").split() if s.strip()]

    uncontrolled = raw.get("uncontrolled_subject", [])
    if isinstance(uncontrolled, str):
        uncontrolled = [uncontrolled]

    doc = {**raw}
    doc["authors"] = authors
    doc["subjects"] = subjects if subjects else uncontrolled
    return doc


def generate_bulk_actions(file_path, parser_func):
    with open(file_path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
                doc = parser_func(raw)
                yield {"_index": INDEX_NAME, "_id": doc["document_id"], "_source": doc}
            except json.JSONDecodeError as e:
                print(f"  Warning: Invalid JSON at line {line_num}: {e}")
            except Exception as e:
                print(f"  Warning: Error parsing line {line_num}: {e}")


def load_to_opensearch(client, file_path, parser_func, source_name):
    stats = LoadStats()
    print(f"\nLoading {source_name} from {file_path.name}...")

    with open(file_path, "r", encoding="utf-8") as f:
        stats.total = sum(1 for line in f if line.strip())
    print(f"  Found {stats.total} documents")

    actions = generate_bulk_actions(file_path, parser_func)

    for ok, result in helpers.streaming_bulk(client, actions, chunk_size=CHUNK_SIZE, raise_on_error=False):
        if ok:
            stats.success += 1
        else:
            stats.failed += 1
            if stats.failed <= 5:
                print(f"  Error: {result}")

        processed = stats.success + stats.failed
        if processed % 10000 == 0:
            print(f"  Progress: {processed}/{stats.total} ({100*processed//stats.total}%)")

    print(f"  Completed: {stats}")
    return stats


def sync_to_postgres(client):
    print("\nSyncing to PostgreSQL...")
    docs = []

    response = client.search(
        index=INDEX_NAME,
        body={"query": {"match_all": {}}, "_source": ["document_id", "title", "authors", "document_type", "year", "subjects", "language"]},
        scroll="2m",
        size=1000,
    )

    scroll_id = response["_scroll_id"]
    hits = response["hits"]["hits"]

    while hits:
        for hit in hits:
            docs.append(hit["_source"])
        response = client.scroll(scroll_id=scroll_id, scroll="2m")
        scroll_id = response["_scroll_id"]
        hits = response["hits"]["hits"]
        if len(docs) % 10000 == 0:
            print(f"  Fetched {len(docs)} documents...")

    client.clear_scroll(scroll_id=scroll_id)
    print(f"  Fetched {len(docs)} documents from OpenSearch")

    inserted = 0
    with psycopg.connect(PG_DSN) as conn:
        with conn.cursor() as cur:
            for doc in docs:
                try:
                    doc_id = doc.get("document_id", "")[:50]
                    if not doc_id:
                        continue
                    title = doc.get("title") or "No title"
                    authors = doc.get("authors", [])
                    if isinstance(authors, str):
                        authors = [authors]
                    doc_type = (doc.get("document_type") or "Unknown")[:50]
                    year = doc.get("year")
                    if year and not isinstance(year, int):
                        try:
                            year = int(year)
                        except (ValueError, TypeError):
                            year = None
                    subject = doc.get("knowledge_area") or (doc.get("subjects", [""])[0] if doc.get("subjects") else "")
                    if isinstance(subject, list):
                        subject = subject[0] if subject else ""
                    subject = subject[:100] if subject else None
                    language = doc.get("language", "ru")[:100]

                    cur.execute("""
                        INSERT INTO documents (document_id, title, authors, document_type, year, subject, language)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (document_id) DO NOTHING
                    """, (doc_id, title, authors, doc_type, year, subject, language))
                    inserted += 1

                    if inserted % 10000 == 0:
                        print(f"  Inserted {inserted} documents...")
                        conn.commit()

                except Exception as e:
                    conn.rollback()
                    if inserted < 5:
                        print(f"  Warning: Failed to insert {doc.get('document_id')}: {e}")

            conn.commit()

    print(f"  Synced {inserted} documents to PostgreSQL")
    return inserted


def main():
    print("=" * 60)
    print("NSU Library Documents Loader")
    print("=" * 60)

    print(f"\nScript: {Path(__file__).resolve()}")
    print(f"Base dir: {BASE_DIR}")

    if not ELIB_PATH.exists():
        print(f"Error: {ELIB_PATH} not found")
        sys.exit(1)
    if not RUSLAN_PATH.exists():
        print(f"Error: {RUSLAN_PATH} not found")
        sys.exit(1)

    print(f"\nData files:")
    print(f"  - E-library: {ELIB_PATH}")
    print(f"  - Ruslan: {RUSLAN_PATH}")

    client = create_opensearch_client()

    try:
        info = client.info()
        print(f"\nOpenSearch: {info['version']['number']}")
    except Exception as e:
        print(f"Error: Cannot connect to OpenSearch: {e}")
        sys.exit(1)

    create_index(client)

    elib_stats = load_to_opensearch(client, ELIB_PATH, parse_elib_document, "E-library")
    ruslan_stats = load_to_opensearch(client, RUSLAN_PATH, parse_ruslan_document, "Ruslan")

    print("\nRefreshing index...")
    client.indices.refresh(index=INDEX_NAME)

    count = client.count(index=INDEX_NAME)["count"]
    print(f"\nTotal documents in OpenSearch: {count}")

    try:
        sync_to_postgres(client)
    except Exception as e:
        print(f"Warning: Failed to sync to PostgreSQL: {e}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"E-library: {elib_stats}")
    print(f"Ruslan: {ruslan_stats}")
    print(f"Total: {count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
