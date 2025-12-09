#!/usr/bin/env python3
"""
Динамический импорт книг из JSON - сохраняет ВСЕ поля
"""
import json
import sys
import re
from datetime import datetime
import psycopg2
from psycopg2.extras import Json
from opensearchpy import OpenSearch, helpers

# Настройки
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "library_search",
    "user": "library_user",
    "password": "library_password"
}

OPENSEARCH_HOST = "localhost"
OPENSEARCH_PORT = 9200
INDEX_NAME = "library_documents"

# Файл с данными
JSON_FILE = "books.json"


def analyze_fields(records):
    """Анализ всех полей в JSON"""
    all_fields = {}
    
    for record in records:
        for field, value in record.items():
            if field not in all_fields:
                all_fields[field] = {
                    'count': 0,
                    'examples': [],
                    'type': type(value).__name__
                }
            all_fields[field]['count'] += 1
            if len(all_fields[field]['examples']) < 2 and value:
                all_fields[field]['examples'].append(str(value)[:50])
    
    return all_fields


def create_dynamic_table(cursor, all_fields):
    """Создать таблицу с динамическими полями"""
    
    # Удаляем старую таблицу documents и связанные данные
    print("🗑️  Удаление старых данных...")
    cursor.execute("DROP TABLE IF EXISTS clicks CASCADE")
    cursor.execute("DROP TABLE IF EXISTS impressions CASCADE")
    cursor.execute("DROP TABLE IF EXISTS search_queries CASCADE")
    cursor.execute("DROP TABLE IF EXISTS documents CASCADE")
    cursor.execute("DROP MATERIALIZED VIEW IF EXISTS ctr_stats CASCADE")
    
    # Базовые поля
    columns = [
        "document_id VARCHAR(100) PRIMARY KEY",
        "source VARCHAR(50) DEFAULT 'e-lib.nsu.ru'",
        "indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    ]
    
    # Динамические поля из JSON
    field_mapping = {}
    for field in all_fields.keys():
        # Преобразуем имя поля в snake_case для PostgreSQL
        pg_field = field.lower()
        pg_field = re.sub(r'[^a-zа-яё0-9_]', '_', pg_field)
        pg_field = re.sub(r'_+', '_', pg_field).strip('_')
        
        # Если поле на русском, транслитерируем или используем как есть
        if not pg_field or pg_field[0].isdigit():
            pg_field = 'field_' + pg_field
        
        field_mapping[field] = pg_field
        columns.append(f'"{pg_field}" TEXT')
    
    # Создаем таблицу
    create_sql = f"""
    CREATE TABLE documents (
        {', '.join(columns)}
    )
    """
    
    print("📋 Создание таблицы documents с полями:")
    for orig, pg in sorted(field_mapping.items()):
        print(f"   {orig} → {pg}")
    
    cursor.execute(create_sql)
    
    # Создаем индексы для основных полей поиска
    try:
        cursor.execute('CREATE INDEX idx_doc_title ON documents("title")')
    except:
        pass
    
    return field_mapping


def recreate_related_tables(cursor):
    """Пересоздать связанные таблицы"""
    
    # search_queries
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_queries (
            query_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
            query_text TEXT NOT NULL,
            results_count INTEGER,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_id VARCHAR(100)
        )
    """)
    
    # clicks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clicks (
            click_id SERIAL PRIMARY KEY,
            query_id INTEGER REFERENCES search_queries(query_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
            document_id VARCHAR(100),
            query_text TEXT NOT NULL,
            position INTEGER NOT NULL,
            clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            dwell_time INTEGER,
            session_id VARCHAR(100)
        )
    """)
    
    # impressions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS impressions (
            impression_id SERIAL PRIMARY KEY,
            query_id INTEGER REFERENCES search_queries(query_id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
            document_id VARCHAR(100),
            query_text TEXT NOT NULL,
            position INTEGER NOT NULL,
            shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_id VARCHAR(100)
        )
    """)
    
    # ctr_stats
    cursor.execute("""
        CREATE MATERIALIZED VIEW ctr_stats AS
        SELECT 
            i.query_text,
            i.document_id,
            COUNT(DISTINCT i.impression_id) as impressions_count,
            COUNT(DISTINCT c.click_id) as clicks_count,
            CASE 
                WHEN COUNT(DISTINCT i.impression_id) > 0 
                THEN CAST(COUNT(DISTINCT c.click_id) AS FLOAT) / COUNT(DISTINCT i.impression_id)
                ELSE 0 
            END as ctr
        FROM impressions i
        LEFT JOIN clicks c ON i.query_text = c.query_text AND i.document_id = c.document_id
        GROUP BY i.query_text, i.document_id
        HAVING COUNT(DISTINCT i.impression_id) >= 3
    """)
    
    print("✅ Связанные таблицы пересозданы")


def save_to_postgres(records, field_mapping):
    """Сохранить в PostgreSQL"""
    print(f"\n💾 Сохранение {len(records)} документов в PostgreSQL...")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Создаем таблицу
        field_mapping = create_dynamic_table(cursor, analyze_fields(records))
        conn.commit()
        
        # Вставляем данные
        inserted = 0
        for i, record in enumerate(records):
            # Генерируем ID
            doc_id = record.get('Ключ записи', '') or f"doc_{i}"
            doc_id = doc_id.replace('\\', '_').replace('/', '_')[:100]
            
            # Собираем поля и значения
            fields = ['document_id', 'source']
            values = [doc_id, 'e-lib.nsu.ru']
            placeholders = ['%s', '%s']
            
            for orig_field, pg_field in field_mapping.items():
                if orig_field in record and record[orig_field]:
                    fields.append(f'"{pg_field}"')
                    values.append(str(record[orig_field])[:10000])  # Ограничение длины
                    placeholders.append('%s')
            
            # INSERT
            sql = f"""
                INSERT INTO documents ({', '.join(fields)})
                VALUES ({', '.join(placeholders)})
                ON CONFLICT (document_id) DO NOTHING
            """
            
            try:
                cursor.execute(sql, values)
                inserted += 1
            except Exception as e:
                if inserted < 5:
                    print(f"   ⚠️  Ошибка: {e}")
            
            if (i + 1) % 1000 == 0:
                print(f"   Обработано: {i + 1}/{len(records)}")
                conn.commit()
        
        conn.commit()
        
        # Пересоздаем связанные таблицы
        recreate_related_tables(cursor)
        conn.commit()
        
        print(f"✅ Вставлено: {inserted} документов")
        
    finally:
        cursor.close()
        conn.close()
    
    return field_mapping


def create_opensearch_mapping(all_fields):
    """Создать маппинг для OpenSearch"""
    
    properties = {
        "document_id": {"type": "keyword"},
        "source": {"type": "keyword"},
        "indexed_at": {"type": "date"}
    }
    
    # Поля для полнотекстового поиска
    text_fields = ['title', 'авторы', 'другие авторы', 'abstract', 'аннотация', 
                   'описание', 'ключевые слова', 'организация']
    
    # Поля-ключевые слова
    keyword_fields = ['url', 'cover', 'язык', 'тип документа', 'коллекция', 
                      'удк', 'ббк', 'права доступа', 'ключ записи']
    
    for field in all_fields.keys():
        field_lower = field.lower()
        pg_field = re.sub(r'[^a-zа-яё0-9_]', '_', field_lower)
        pg_field = re.sub(r'_+', '_', pg_field).strip('_')
        
        if any(x in field_lower for x in text_fields):
            properties[pg_field] = {
                "type": "text",
                "analyzer": "russian_custom",
                "fields": {"keyword": {"type": "keyword"}}
            }
        else:
            properties[pg_field] = {"type": "text", "analyzer": "russian_custom"}
    
    return properties


def save_to_opensearch(records, all_fields):
    """Сохранить в OpenSearch"""
    print(f"\n📚 Загрузка {len(records)} документов в OpenSearch...")
    
    client = OpenSearch(
        hosts=[{'host': OPENSEARCH_HOST, 'port': OPENSEARCH_PORT}],
        http_compress=True,
        use_ssl=False,
        verify_certs=False
    )
    
    info = client.info()
    print(f"   Подключено к OpenSearch {info['version']['number']}")
    
    # Удаляем старый индекс
    if client.indices.exists(index=INDEX_NAME):
        client.indices.delete(index=INDEX_NAME)
        print(f"   Старый индекс удалён")
    
    # Создаем индекс с динамическим маппингом
    index_settings = {
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "russian_custom": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "russian_stop", "russian_stemmer"]
                    }
                },
                "filter": {
                    "russian_stop": {"type": "stop", "stopwords": "_russian_"},
                    "russian_stemmer": {"type": "stemmer", "language": "russian"}
                }
            }
        },
        "mappings": {
            "dynamic": True,  # Разрешаем динамические поля
            "properties": create_opensearch_mapping(all_fields)
        }
    }
    
    client.indices.create(index=INDEX_NAME, body=index_settings)
    print(f"   Индекс создан")
    
    # Подготовка документов
    actions = []
    for i, record in enumerate(records):
        doc_id = record.get('Ключ записи', '') or f"doc_{i}"
        doc_id = doc_id.replace('\\', '_').replace('/', '_')[:100]
        
        # Преобразуем все поля
        doc = {
            "document_id": doc_id,
            "source": "e-lib.nsu.ru",
            "indexed_at": datetime.now().isoformat()
        }
        
        for field, value in record.items():
            if value:
                pg_field = re.sub(r'[^a-zа-яё0-9_]', '_', field.lower())
                pg_field = re.sub(r'_+', '_', pg_field).strip('_')
                doc[pg_field] = str(value)
        
        actions.append({
            "_index": INDEX_NAME,
            "_id": doc_id,
            "_source": doc
        })
    
    # Bulk загрузка
    success, failed = helpers.bulk(client, actions, chunk_size=500, raise_on_error=False)
    print(f"✅ Загружено: {success} документов")
    if failed:
        print(f"⚠️  Ошибок: {len(failed)}")
    
    client.indices.refresh(index=INDEX_NAME)


def main():
    print("=" * 60)
    print("📚 ДИНАМИЧЕСКИЙ ИМПОРТ КНИГ ИЗ JSON")
    print("=" * 60)
    
    # Загрузка JSON
    print(f"\n📖 Чтение файла: {JSON_FILE}")
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            records = json.load(f)
    except FileNotFoundError:
        print(f"❌ Файл не найден: {JSON_FILE}")
        sys.exit(1)
    
    print(f"✅ Загружено {len(records)} записей")
    
    # Анализ полей
    print("\n🔍 Анализ полей...")
    all_fields = analyze_fields(records)
    
    print(f"\n📋 Найдено {len(all_fields)} уникальных полей:")
    for field, info in sorted(all_fields.items(), key=lambda x: -x[1]['count']):
        print(f"   {field}: {info['count']} записей")
    
    # Сохранение
    field_mapping = save_to_postgres(records, all_fields)
    save_to_opensearch(records, all_fields)
    
    print("\n" + "=" * 60)
    print("✅ ИМПОРТ ЗАВЕРШЁН!")
    print("=" * 60)
    print(f"\n🔍 Тест:")
    print(f"   curl -X POST http://localhost:8000/api/search/ \\")
    print(f"     -H 'Content-Type: application/json' \\")
    print(f"     -d '{{\"query\": \"история\", \"top_k\": 5}}'")


if __name__ == "__main__":
    main()
