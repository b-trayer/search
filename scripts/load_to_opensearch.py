#!/usr/bin/env python3
"""
Скрипт загрузки документов в OpenSearch
"""
import json
import sys
from opensearchpy import OpenSearch, helpers
from opensearchpy.exceptions import RequestError

# Настройки подключения
OPENSEARCH_HOST = 'localhost'
OPENSEARCH_PORT = 9200
INDEX_NAME = 'library_documents'

def connect_opensearch():
    """Подключение к OpenSearch"""
    client = OpenSearch(
        hosts=[{'host': OPENSEARCH_HOST, 'port': OPENSEARCH_PORT}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False,
        ssl_assert_hostname=False,
        ssl_show_warn=False
    )
    
    info = client.info()
    print(f"✅ Подключено к OpenSearch {info['version']['number']}")
    print(f"   Кластер: {info['cluster_name']}")
    return client

def create_index(client):
    """Создание индекса с настройками"""
    
    # Удалим старый индекс если есть
    if client.indices.exists(index=INDEX_NAME):
        print(f"🗑️  Удаление существующего индекса '{INDEX_NAME}'...")
        client.indices.delete(index=INDEX_NAME)
    
    # Упрощенные настройки индекса
    index_settings = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "max_result_window": 10000,
            "analysis": {
                "analyzer": {
                    "russian_custom": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": [
                            "lowercase",
                            "russian_stop",
                            "russian_stemmer"
                        ]
                    }
                },
                "filter": {
                    "russian_stop": {
                        "type": "stop",
                        "stopwords": "_russian_"
                    },
                    "russian_stemmer": {
                        "type": "stemmer",
                        "language": "russian"
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "document_id": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "analyzer": "russian_custom",
                    "fields": {
                        "keyword": {"type": "keyword"}
                    }
                },
                "authors": {
                    "type": "text",
                    "analyzer": "russian_custom",
                    "fields": {
                        "keyword": {"type": "keyword"}
                    }
                },
                "abstract": {
                    "type": "text",
                    "analyzer": "russian_custom"
                },
                "content": {
                    "type": "text",
                    "analyzer": "russian_custom"
                },
                "document_type": {"type": "keyword"},
                "year": {"type": "integer"},
                "subject": {"type": "keyword"},
                "isbn": {"type": "keyword"},
                "doi": {"type": "keyword"},
                "pages": {"type": "integer"},
                "language": {"type": "keyword"},
                "indexed_at": {
                    "type": "date",
                    "format": "strict_date_optional_time||epoch_millis"
                }
            }
        }
    }
    
    print(f"🔧 Создание индекса '{INDEX_NAME}'...")
    try:
        client.indices.create(index=INDEX_NAME, body=index_settings)
        print(f"✅ Индекс создан успешно")
    except RequestError as e:
        print(f"❌ Ошибка создания индекса: {e}")
        sys.exit(1)

def load_documents(client):
    """Загрузка документов из JSON"""
    
    json_file = 'backend/data/documents.json'
    print(f"📖 Чтение документов из {json_file}...")
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            documents = json.load(f)
    except FileNotFoundError:
        print(f"❌ Файл {json_file} не найден!")
        print("   Сначала запустите: python scripts/generate_data.py")
        sys.exit(1)
    
    print(f"📚 Загружено {len(documents)} документов")
    
    # Подготовка для bulk insert
    actions = []
    for doc in documents:
        action = {
            "_index": INDEX_NAME,
            "_id": doc["document_id"],
            "_source": doc
        }
        actions.append(action)
    
    # Bulk загрузка
    print(f"💾 Загрузка документов в OpenSearch...")
    try:
        success, failed = helpers.bulk(client, actions, chunk_size=100, raise_on_error=False)
        print(f"✅ Успешно загружено: {success} документов")
        if failed:
            print(f"❌ Ошибок при загрузке: {len(failed)}")
    except Exception as e:
        print(f"❌ Ошибка при bulk загрузке: {e}")
        sys.exit(1)
    
    # Обновление индекса
    client.indices.refresh(index=INDEX_NAME)
    print("🔄 Индекс обновлен")

def verify_index(client):
    """Проверка созданного индекса"""
    
    print(f"\n🔍 Проверка индекса '{INDEX_NAME}'...")
    
    # Количество документов
    count = client.count(index=INDEX_NAME)
    print(f"📊 Документов в индексе: {count['count']}")
    
    # Размер индекса
    stats = client.indices.stats(index=INDEX_NAME)
    size_mb = stats['_all']['total']['store']['size_in_bytes'] / (1024 * 1024)
    print(f"💾 Размер индекса: {size_mb:.2f} MB")
    
    # Тестовый поиск
    print(f"\n🔎 Тестовый поиск:")
    test_queries = ["машинное обучение", "алгоритмы", "математический анализ"]
    
    for query in test_queries:
        response = client.search(
            index=INDEX_NAME,
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "abstract^2", "content"],
                        "fuzziness": "AUTO"
                    }
                },
                "size": 3
            }
        )
        
        hits = response['hits']['total']['value']
        print(f"   '{query}': найдено {hits} документов")
        
        if response['hits']['hits']:
            top_doc = response['hits']['hits'][0]['_source']
            score = response['hits']['hits'][0]['_score']
            print(f"      Топ результат: '{top_doc['title'][:50]}...' (score: {score:.2f})")

def main():
    print("=" * 70)
    print("📚 ЗАГРУЗКА ДОКУМЕНТОВ В OPENSEARCH")
    print("=" * 70)
    
    # Подключение
    print("🔌 Подключение к OpenSearch...")
    client = connect_opensearch()
    
    # Создание индекса
    create_index(client)
    
    # Загрузка документов
    load_documents(client)
    
    # Проверка
    verify_index(client)
    
    print("\n✅ Загрузка завершена успешно!")
    print(f"🌐 OpenSearch Dashboards: http://localhost:5601")
    print(f"🔍 Dev Tools: http://localhost:5601/app/dev_tools#/console")

if __name__ == "__main__":
    main()
