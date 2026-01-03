#!/usr/bin/env python3

import argparse
import json
import time
import sys
import re
from pathlib import Path
from typing import Iterator, Optional, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://ruslan-neo.nsu.ru/rrs-web/db/BOOKS+SERIAL+ANALITOLD+ABSTRACT+ANALITBOOKS+ANALITSERIAL+ANALITNSU+ELRES+ELCOPY+NETRES"

DEFAULT_PARAMS = {
    "query": 'ruslan.encLevel<>"3"',
    "queryType": "cql",
    "recordSchema": "gost-7.0.100",
}

BATCH_SIZE = 50
REQUEST_DELAY = 0.5
SOURCE_NAME = "Digital catalogue"

SKIP_CLASSES = frozenset({
    "punct", "endsWithFullStop", "bibliographicRecord", "bibliographicDescription",
    "general", "header", "monograph", "multilevel", "hLevel_0", "hLevel_1",
    "additional", "originatingSource"
})

DOC_TYPE_KEYWORDS = {
    "doctoral_dissertation": ["д-ра", "доктор"],
    "dissertation": ["дис.", "диссерт"],
    "autoreferat": ["автореф"],
    "textbook": ["учеб"],
    "monograph": ["моногр"],
    "tutorial": ["практик"],
    "reference": ["справоч"],
    "dictionary": ["словар"],
    "article": ["статья"],
    "collection": ["сборник"],
    "manual": ["пособ"],
    "methodical": ["метод"],
    "proceedings": ["конференц"],
}

DB_TYPE_MAPPING = {
    "ABSTRACT": "dissertation",
    "BOOKS": "book",
    "SERIAL": "serial",
    "ANALITOLD": "article",
    "ANALITBOOKS": "book_article",
    "ANALITSERIAL": "journal_article",
    "ANALITNSU": "nsu_article",
    "ELRES": "electronic",
    "ELCOPY": "electronic_copy",
    "NETRES": "network_resource",
}


class ProgressTracker:
    def __init__(self):
        self.start_time = time.time()
        self.last_count = 0
        self.last_time = self.start_time
        self.speeds = []

    def update(self, fetched: int, total: int):
        now = time.time()
        elapsed = now - self.start_time

        if now - self.last_time > 0.5:
            speed = (fetched - self.last_count) / (now - self.last_time)
            self.speeds.append(speed)
            if len(self.speeds) > 10:
                self.speeds.pop(0)
            self.last_count = fetched
            self.last_time = now

        avg_speed = sum(self.speeds) / len(self.speeds) if self.speeds else 0
        eta = (total - fetched) / avg_speed if avg_speed > 0 else 0

        pct = (fetched / total * 100) if total else 0
        filled = int(25 * fetched / total) if total else 0
        bar = "=" * filled + "-" * (25 - filled)

        speed_str = f"{avg_speed:.1f}" if avg_speed > 0 else "..."
        eta_str = format_time(eta) if avg_speed > 0 else "..."

        print(f"\r[{bar}] {pct:5.1f}% | {fetched:,}/{total:,} | {speed_str}/s | {format_time(elapsed)} | ETA:{eta_str}   ", end="", flush=True)


def format_time(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.0f}s"
    if seconds < 3600:
        m, s = divmod(int(seconds), 60)
        return f"{m}m {s}s"
    h, remainder = divmod(int(seconds), 3600)
    m, s = divmod(remainder, 60)
    return f"{h}h {m}m"


def camel_to_snake(name: str) -> str:
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def merge_into_dict(target: dict, key: str, value: Any) -> None:
    if key not in target:
        target[key] = value
        return

    existing = target[key]
    if not isinstance(existing, list):
        existing = [existing]
    if isinstance(value, list):
        existing.extend(value)
    else:
        existing.append(value)
    target[key] = existing


def extract_text(element: dict) -> str:
    if not element:
        return ""
    if "html" in element:
        return element["html"].strip()
    if "children" in element:
        texts = [extract_text(child) for child in element["children"]
                 if isinstance(child, dict) and not child.get("class", "").startswith("punct")]
        return " ".join(t for t in texts if t).strip()
    return ""


def extract_all_fields(element: Any) -> dict[str, Any]:
    result = {}

    if isinstance(element, dict):
        css_class = element.get("class", "")
        text = extract_text(element)

        if css_class and text:
            field_name = css_class.split()[0]
            if field_name not in SKIP_CLASSES:
                merge_into_dict(result, camel_to_snake(field_name), text)

        for child in element.get("children", []):
            for key, value in extract_all_fields(child).items():
                merge_into_dict(result, key, value)

    elif isinstance(element, list):
        for item in element:
            for key, value in extract_all_fields(item).items():
                merge_into_dict(result, key, value)

    return result


def parse_year(text: str) -> Optional[int]:
    if not text:
        return None
    match = re.search(r'\b(19|20)\d{2}\b', str(text))
    return int(match.group()) if match else None


def parse_authors(fields: dict) -> list[str]:
    entries = fields.get("entry", [])
    expansions = fields.get("expansion_of_initials", [])

    if isinstance(entries, str):
        entries = [entries]
    if isinstance(expansions, str):
        expansions = [expansions]

    authors = [f"{entry}, {expansions[i]}" if i < len(expansions) else entry
               for i, entry in enumerate(entries)]

    return list(dict.fromkeys(authors))


def infer_document_type(fields: dict, database: str) -> str:
    other_info = fields.get("other_info", "")
    if isinstance(other_info, list):
        other_info = " ".join(other_info)
    other_lower = other_info.lower()

    if "дис." in other_lower or "диссерт" in other_lower:
        if any(kw in other_lower for kw in DOC_TYPE_KEYWORDS["doctoral_dissertation"]):
            return "doctoral_dissertation"
        return "dissertation"

    for doc_type, keywords in DOC_TYPE_KEYWORDS.items():
        if doc_type in ("doctoral_dissertation", "dissertation"):
            continue
        if any(kw in other_lower for kw in keywords):
            return doc_type

    return DB_TYPE_MAPPING.get(database, "other")


def extract_specialty(fields: dict) -> Optional[str]:
    other_info = fields.get("other_info", "")
    if isinstance(other_info, list):
        other_info = " ".join(other_info)
    match = re.search(r'\b(\d{2}\.\d{2}\.\d{2})\b', other_info)
    return match.group(1) if match else None


def parse_record(raw_record: dict) -> Optional[dict]:
    try:
        record_id = raw_record.get("recordIdentifier", "")
        content = raw_record.get("recordData", {}).get("content", [])
        extra = raw_record.get("extraRecordData", {}).get("any", [])

        if not content:
            return None

        metadata = {}
        for item in extra:
            for key in ("databaseName", "created", "lastModified", "createdBy", "lastModifiedBy"):
                if key in item:
                    metadata[key] = item[key]

        fields = extract_all_fields(content)
        database = metadata.get("databaseName", "")

        result = {
            "source": SOURCE_NAME,
            "document_id": record_id,
            "database": database,
            "card_url": f"https://ruslan-neo.nsu.ru/pwb/action/rec?id={record_id}" if record_id else None,
            "title": fields.get("title_proper", ""),
            "authors": parse_authors(fields),
            "year": parse_year(fields.get("date_of_publication", "")),
            "document_type": infer_document_type(fields, database),
            "specialty_code": extract_specialty(fields),
            "_created": metadata.get("created"),
            "_modified": metadata.get("lastModified"),
            "_created_by": metadata.get("createdBy"),
            "_modified_by": metadata.get("lastModifiedBy"),
        }

        skip_fields = {"title_proper", "entry", "expansion_of_initials", "date_of_publication", "first_responsibility"}
        for key, value in fields.items():
            if key not in skip_fields and key not in result:
                result[key] = value

        return result

    except Exception as e:
        print(f"\nParsing error: {e}", file=sys.stderr)
        return None


def create_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; NSU Library Parser)",
        "Accept": "application/json",
    })
    return session


def fetch_records(session: requests.Session, start_record: int, max_records: int = BATCH_SIZE) -> tuple[list[dict], int, int]:
    params = {**DEFAULT_PARAMS, "startRecord": start_record, "maximumRecords": max_records}
    response = session.get(BASE_URL, params=params, timeout=60)
    response.raise_for_status()
    data = response.json()
    return (
        data.get("records", {}).get("record", []),
        data.get("numberOfRecords", 0),
        data.get("nextRecordPosition", start_record + max_records),
    )


def iter_all_records(
    session: requests.Session,
    max_records: Optional[int] = None,
    delay: float = REQUEST_DELAY,
    progress: Optional[ProgressTracker] = None,
) -> Iterator[dict]:
    start = 1
    fetched = 0
    total = None

    while True:
        records, total_count, next_pos = fetch_records(session, start)

        if total is None:
            total = min(total_count, max_records) if max_records else total_count

        for raw_record in records:
            record = parse_record(raw_record)
            if record:
                yield record
                fetched += 1
                if progress:
                    progress.update(fetched, total)
                if max_records and fetched >= max_records:
                    return

        if not records or next_pos > total_count:
            break

        start = next_pos
        time.sleep(delay)


def main():
    parser = argparse.ArgumentParser(description="NSU Digital Catalogue parser (ruslan-neo.nsu.ru)")
    parser.add_argument("--output", "-o", type=str, default="ruslan_full.jsonl", help="Output file path")
    parser.add_argument("--max-records", "-n", type=int, default=None, help="Maximum records")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY, help=f"Request delay (default {REQUEST_DELAY})")
    args = parser.parse_args()

    output_path = Path(args.output)
    print(f"Digital Catalogue NSU Parser\nOutput: {output_path}")
    if args.max_records:
        print(f"Limit: {args.max_records}")
    print()

    session = create_session()

    print("Fetching info...")
    _, total, _ = fetch_records(session, 1, 1)

    if args.max_records:
        total = min(total, args.max_records)

    batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Total records: {total:,}")
    print(f"Batches of {BATCH_SIZE}: {batches}")
    print(f"Estimated time: {format_time(batches * args.delay + total * 0.01)}\n")

    progress = ProgressTracker()
    count = 0
    field_stats = {}

    with open(output_path, "w", encoding="utf-8") as f:
        for record in iter_all_records(session, args.max_records, args.delay, progress):
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
            for key in record:
                if not key.startswith("_"):
                    field_stats[key] = field_stats.get(key, 0) + 1

    total_time = time.time() - progress.start_time
    print(f"\n\nSaved {count:,} records to {output_path}")
    print(f"Time: {format_time(total_time)}")
    print(f"Speed: {count / total_time:.1f} records/sec\n")

    print("Fields found:")
    sorted_fields = sorted(field_stats.items(), key=lambda x: -x[1])
    for field, cnt in sorted_fields[:25]:
        print(f"  {field:35} {cnt:>8} ({cnt / count * 100:5.1f}%)")
    if len(sorted_fields) > 25:
        print(f"  ... and {len(sorted_fields) - 25} more fields")

    print("\nSample record:")
    with open(output_path, "r", encoding="utf-8") as f:
        record = json.loads(f.readline())
        for key, value in list(record.items())[:12]:
            if key.startswith("_"):
                continue
            if isinstance(value, str) and len(value) > 60:
                value = value[:60] + "..."
            if isinstance(value, list) and len(value) > 3:
                value = value[:3] + ["..."]
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
