#!/usr/bin/env python3
"""
Генератор синтетических данных для библиотечной поисковой системы
Создает: пользователей, документы, запросы и клики
"""
import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sys
import os

# Добавляем путь к backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import psycopg2

# Настройки
fake = Faker(['ru_RU'])
Faker.seed(42)
random.seed(42)

# Параметры генерации
NUM_USERS = 80
NUM_DOCUMENTS = 600
NUM_QUERIES = 150
CLICKS_PER_QUERY = 15  # В среднем

# Конфигурация БД
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'library_search',
    'user': 'library_user',
    'password': 'library_password'
}

# ==================== СПРАВОЧНИКИ ====================

SUBJECTS = [
    'computer_science', 'mathematics', 'physics', 'chemistry',
    'biology', 'economics', 'psychology', 'linguistics',
    'philosophy', 'history', 'sociology', 'law'
]

SUBJECTS_RU = {
    'computer_science': 'Информатика',
    'mathematics': 'Математика',
    'physics': 'Физика',
    'chemistry': 'Химия',
    'biology': 'Биология',
    'economics': 'Экономика',
    'psychology': 'Психология',
    'linguistics': 'Лингвистика',
    'philosophy': 'Философия',
    'history': 'История',
    'sociology': 'Социология',
    'law': 'Юриспруденция'
}

DOCUMENT_TYPES = ['textbook', 'article', 'monograph']

USER_ROLES = ['student', 'master', 'phd', 'professor']

# Тематические термины по предметам
SUBJECT_TERMS = {
    'computer_science': [
        'алгоритмы', 'структуры данных', 'машинное обучение', 'нейронные сети',
        'базы данных', 'программирование', 'операционные системы', 'компиляторы',
        'искусственный интеллект', 'компьютерное зрение', 'обработка языка',
        'распределенные системы', 'криптография', 'веб-разработка'
    ],
    'mathematics': [
        'математический анализ', 'линейная алгебра', 'дифференциальные уравнения',
        'теория вероятностей', 'математическая статистика', 'дискретная математика',
        'топология', 'функциональный анализ', 'теория чисел', 'комбинаторика',
        'оптимизация', 'численные методы'
    ],
    'physics': [
        'механика', 'термодинамика', 'электродинамика', 'квантовая механика',
        'статистическая физика', 'оптика', 'ядерная физика', 'физика твердого тела',
        'астрофизика', 'теория относительности', 'квантовая теория поля'
    ],
    'chemistry': [
        'органическая химия', 'неорганическая химия', 'физическая химия',
        'аналитическая химия', 'биохимия', 'квантовая химия', 'химическая кинетика',
        'электрохимия', 'коллоидная химия'
    ],
    'biology': [
        'молекулярная биология', 'генетика', 'биохимия', 'микробиология',
        'экология', 'эволюция', 'физиология', 'анатомия', 'ботаника',
        'зоология', 'биотехнология'
    ],
    'economics': [
        'микроэкономика', 'макроэкономика', 'эконометрика', 'финансы',
        'менеджмент', 'маркетинг', 'международная экономика', 'экономическая теория',
        'бухгалтерский учет', 'инвестиции'
    ],
    'psychology': [
        'когнитивная психология', 'социальная психология', 'психология развития',
        'клиническая психология', 'нейропсихология', 'психодиагностика',
        'психотерапия', 'организационная психология'
    ],
    'linguistics': [
        'фонетика', 'морфология', 'синтаксис', 'семантика', 'прагматика',
        'социолингвистика', 'психолингвистика', 'типология языков',
        'историческая лингвистика', 'компьютерная лингвистика'
    ],
    'philosophy': [
        'онтология', 'гносеология', 'этика', 'логика', 'эстетика',
        'философия науки', 'социальная философия', 'философия сознания',
        'феноменология', 'герменевтика'
    ],
    'history': [
        'древняя история', 'средневековье', 'новое время', 'новейшая история',
        'историография', 'археология', 'этнография', 'история России',
        'всемирная история', 'военная история'
    ],
    'sociology': [
        'социальная теория', 'социальная структура', 'социология культуры',
        'социология религии', 'социология образования', 'урбанистика',
        'социология семьи', 'социальные изменения'
    ],
    'law': [
        'гражданское право', 'уголовное право', 'конституционное право',
        'административное право', 'международное право', 'трудовое право',
        'процессуальное право', 'теория права'
    ]
}


# ==================== ГЕНЕРАТОРЫ ====================

def generate_users(num_users: int) -> List[Dict[str, Any]]:
    """Генерация пользователей"""
    print(f"📝 Генерация {num_users} пользователей...")

    users = []
    role_distribution = {
        'student': 0.50,  # 50% студентов
        'master': 0.25,  # 25% магистрантов
        'phd': 0.15,  # 15% аспирантов
        'professor': 0.10  # 10% преподавателей
    }

    for i in range(num_users):
        role = random.choices(
            list(role_distribution.keys()),
            weights=list(role_distribution.values())
        )[0]

        specialization = random.choice(SUBJECTS)

        # Интересы пользователя (2-4 темы)
        num_interests = random.randint(2, 4)
        interests = random.sample(SUBJECT_TERMS[specialization], num_interests)

        # Курс только для студентов и магистров
        course = None
        if role == 'student':
            course = random.randint(1, 4)
        elif role == 'master':
            course = random.randint(1, 2)

        username = fake.user_name() + str(random.randint(100, 999))

        user = {
            'username': username,
            'email': f"{username}@university.edu",
            'role': role,
            'specialization': specialization,
            'course': course,
            'interests': interests
        }

        users.append(user)

    print(f"✅ Создано {len(users)} пользователей")
    return users


def generate_documents(num_documents: int) -> List[Dict[str, Any]]:
    """Генерация документов"""
    print(f"📚 Генерация {num_documents} документов...")

    documents = []

    # Распределение типов документов
    type_distribution = {
        'textbook': 0.40,  # 40% учебники
        'article': 0.35,  # 35% статьи
        'monograph': 0.25  # 25% монографии
    }

    for i in range(num_documents):
        doc_type = random.choices(
            list(type_distribution.keys()),
            weights=list(type_distribution.values())
        )[0]

        subject = random.choice(SUBJECTS)
        subject_ru = SUBJECTS_RU[subject]
        terms = SUBJECT_TERMS[subject]

        # Выбираем 2-3 термина для названия
        title_terms = random.sample(terms, min(random.randint(2, 3), len(terms)))

        # Генерация названия в зависимости от типа
        if doc_type == 'textbook':
            title = f"{title_terms[0].capitalize()}: учебник по {subject_ru.lower()}"
        elif doc_type == 'article':
            title = f"{title_terms[0].capitalize()} в контексте {title_terms[1]}"
        else:  # monograph
            title = f"Исследование {title_terms[0]}: теория и практика"

        # Авторы (1-3)
        num_authors = random.randint(1, 3)
        authors = [fake.name() for _ in range(num_authors)]

        # Год публикации (2000-2024)
        year = random.randint(2000, 2024)

        # Аннотация
        abstract_terms = random.sample(terms, min(5, len(terms)))
        abstract = (
            f"Данная работа посвящена изучению {abstract_terms[0]}. "
            f"Рассматриваются вопросы {abstract_terms[1]} и {abstract_terms[2]}. "
            f"Особое внимание уделяется {abstract_terms[3]}. "
            f"Материал может быть полезен исследователям в области {subject_ru.lower()}."
        )

        # Полный текст (симуляция)
        content = abstract + "\n\n" + "\n".join([
            f"Глава {j + 1}. {term.capitalize()}. "
            f"{''.join(fake.sentences(nb=random.randint(3, 5)))}"
            for j, term in enumerate(random.sample(terms, min(5, len(terms))))
        ])

        document = {
            'document_id': f"doc_{i + 1:05d}",
            'title': title,
            'authors': authors,
            'document_type': doc_type,
            'year': year,
            'subject': subject,
            'abstract': abstract,
            'content': content,
            'isbn': fake.isbn13() if doc_type in ['textbook', 'monograph'] else None,
            'doi': f"10.{random.randint(1000, 9999)}/{fake.uuid4()[:8]}" if doc_type == 'article' else None,
            'pages': random.randint(50, 800) if doc_type != 'article' else random.randint(5, 30),
            'language': 'ru'
        }

        documents.append(document)

    print(f"✅ Создано {len(documents)} документов")
    return documents


def generate_queries_and_clicks(
        users: List[Dict],
        documents: List[Dict],
        num_queries: int
) -> tuple:
    """Генерация поисковых запросов и кликов с учетом профилей пользователей"""
    print(f"🔍 Генерация {num_queries} запросов и кликов...")

    queries = []
    clicks = []
    impressions = []

    query_id = 1
    click_id = 1
    impression_id = 1

    for _ in range(num_queries):
        # Выбираем случайного пользователя
        user = random.choice(users)
        user_id = users.index(user) + 1

        # Генерируем запрос на основе интересов пользователя
        if random.random() < 0.7:  # 70% запросов связаны с интересами
            query_text = random.choice(user['interests'])
        else:  # 30% случайные запросы
            random_subject = random.choice(SUBJECTS)
            query_text = random.choice(SUBJECT_TERMS[random_subject])

        # Добавляем вариативность к запросу
        if random.random() < 0.3:
            modifiers = ['введение в', 'основы', 'продвинутый курс', 'теория']
            query_text = f"{random.choice(modifiers)} {query_text}"

        timestamp = datetime.now() - timedelta(days=random.randint(0, 90))
        session_id = fake.uuid4()

        # Находим релевантные документы
        relevant_docs = [
            doc for doc in documents
            if any(term in doc['title'].lower() or term in doc['abstract'].lower()
                   for term in query_text.lower().split())
        ]

        # Если нет точных совпадений, берем документы по специализации
        if not relevant_docs:
            relevant_docs = [
                doc for doc in documents
                if doc['subject'] == user['specialization']
            ]

        # Если все равно нет, берем случайные
        if not relevant_docs:
            relevant_docs = random.sample(documents, min(20, len(documents)))

        # Ограничиваем до топ-20
        relevant_docs = relevant_docs[:20]

        # Количество результатов
        results_count = len(relevant_docs)

        query = {
            'query_id': query_id,
            'user_id': user_id,
            'query_text': query_text,
            'results_count': results_count,
            'timestamp': timestamp,
            'session_id': session_id
        }
        queries.append(query)

        # Генерируем показы (impressions) для топ-10
        shown_docs = relevant_docs[:10]
        for position, doc in enumerate(shown_docs, start=1):
            impression = {
                'impression_id': impression_id,
                'query_id': query_id,
                'user_id': user_id,
                'document_id': doc['document_id'],
                'query_text': query_text,
                'position': position,
                'shown_at': timestamp,
                'session_id': session_id
            }
            impressions.append(impression)
            impression_id += 1

        # Генерируем клики (вероятность клика зависит от позиции и профиля)
        num_clicks = random.randint(0, min(3, len(shown_docs)))

        for _ in range(num_clicks):
            # Вероятность клика выше для первых позиций
            position_weights = [1.0 / (i + 1) for i in range(len(shown_docs))]
            clicked_doc = random.choices(shown_docs, weights=position_weights)[0]
            position = shown_docs.index(clicked_doc) + 1

            # Буст для документов, соответствующих профилю пользователя
            doc_matches_profile = (
                    clicked_doc['subject'] == user['specialization'] or
                    clicked_doc['document_type'] == ('textbook' if user['role'] == 'student' else 'article')
            )

            if doc_matches_profile:
                if random.random() > 0.3:  # 70% вероятность клика на релевантный документ
                    click_time = timestamp + timedelta(seconds=random.randint(1, 30))
                    dwell_time = random.randint(10, 600) if doc_matches_profile else random.randint(5, 60)

                    click = {
                        'click_id': click_id,
                        'query_id': query_id,
                        'user_id': user_id,
                        'document_id': clicked_doc['document_id'],
                        'query_text': query_text,
                        'position': position,
                        'clicked_at': click_time,
                        'dwell_time': dwell_time,
                        'session_id': session_id
                    }
                    clicks.append(click)
                    click_id += 1

        query_id += 1

    print(f"✅ Создано {len(queries)} запросов")
    print(f"✅ Создано {len(impressions)} показов")
    print(f"✅ Создано {len(clicks)} кликов")

    return queries, impressions, clicks


# ==================== СОХРАНЕНИЕ В БД ====================

def save_to_database(users, documents, queries, impressions, clicks):
    """Сохранение всех данных в PostgreSQL"""
    print("\n💾 Сохранение данных в PostgreSQL...")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Очистка таблиц
        print("🗑️  Очистка существующих данных...")
        cursor.execute("TRUNCATE TABLE clicks, impressions, search_queries, documents, users RESTART IDENTITY CASCADE")

        # Вставка пользователей
        print(f"👥 Вставка {len(users)} пользователей...")
        for user in users:
            cursor.execute("""
                INSERT INTO users (username, email, role, specialization, course, interests)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user['username'], user['email'], user['role'],
                user['specialization'], user['course'], user['interests']
            ))

        # Вставка документов
        print(f"📚 Вставка {len(documents)} документов...")
        for doc in documents:
            cursor.execute("""
                INSERT INTO documents (
                    document_id, title, authors, document_type, year, subject,
                    abstract, isbn, doi, pages, language
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                doc['document_id'], doc['title'], doc['authors'], doc['document_type'],
                doc['year'], doc['subject'], doc['abstract'], doc['isbn'],
                doc['doi'], doc['pages'], doc['language']
            ))

        # Вставка запросов
        print(f"🔍 Вставка {len(queries)} запросов...")
        for query in queries:
            cursor.execute("""
                INSERT INTO search_queries (query_id, user_id, query_text, results_count, timestamp, session_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                query['query_id'], query['user_id'], query['query_text'],
                query['results_count'], query['timestamp'], query['session_id']
            ))

        # Вставка показов
        print(f"👁️  Вставка {len(impressions)} показов...")
        for imp in impressions:
            cursor.execute("""
                INSERT INTO impressions (
                    impression_id, query_id, user_id, document_id, 
                    query_text, position, shown_at, session_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                imp['impression_id'], imp['query_id'], imp['user_id'],
                imp['document_id'], imp['query_text'], imp['position'],
                imp['shown_at'], imp['session_id']
            ))

        # Вставка кликов
        print(f"🖱️  Вставка {len(clicks)} кликов...")
        for click in clicks:
            cursor.execute("""
                INSERT INTO clicks (
                    click_id, query_id, user_id, document_id, query_text,
                    position, clicked_at, dwell_time, session_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                click['click_id'], click['query_id'], click['user_id'],
                click['document_id'], click['query_text'], click['position'],
                click['clicked_at'], click['dwell_time'], click['session_id']
            ))

        # Обновление материализованного представления CTR
        print("📊 Обновление CTR статистики...")
        cursor.execute("REFRESH MATERIALIZED VIEW ctr_stats")

        conn.commit()
        print("✅ Все данные успешно сохранены в PostgreSQL!")

        # Статистика
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"   • Пользователей: {cursor.fetchone()[0]}")

        cursor.execute("SELECT COUNT(*) FROM documents")
        print(f"   • Документов: {cursor.fetchone()[0]}")

        cursor.execute("SELECT COUNT(*) FROM search_queries")
        print(f"   • Запросов: {cursor.fetchone()[0]}")

        cursor.execute("SELECT COUNT(*) FROM impressions")
        print(f"   • Показов: {cursor.fetchone()[0]}")

        cursor.execute("SELECT COUNT(*) FROM clicks")
        print(f"   • Кликов: {cursor.fetchone()[0]}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Ошибка сохранения в БД: {e}")
        raise


def save_documents_json(documents: List[Dict], filename: str = 'documents.json'):
    """Сохранение документов в JSON для загрузки в OpenSearch"""
    print(f"\n💾 Сохранение документов в {filename}...")

    filepath = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False, indent=2, default=str)

    print(f"✅ Документы сохранены в {filepath}")


# ==================== MAIN ====================

def main():
    """Основная функция"""
    print("=" * 70)
    print("🎲 ГЕНЕРАТОР СИНТЕТИЧЕСКИХ ДАННЫХ ДЛЯ БИБЛИОТЕЧНОЙ ПОИСКОВОЙ СИСТЕМЫ")
    print("=" * 70)
    print()

    # Генерация данных
    users = generate_users(NUM_USERS)
    documents = generate_documents(NUM_DOCUMENTS)
    queries, impressions, clicks = generate_queries_and_clicks(users, documents, NUM_QUERIES)

    # Сохранение в БД
    save_to_database(users, documents, queries, impressions, clicks)

    # Сохранение документов в JSON
    save_documents_json(documents)

    print("\n" + "=" * 70)
    print("🎉 ГЕНЕРАЦИЯ ДАННЫХ ЗАВЕРШЕНА!")
    print("=" * 70)
    print("\n📊 Статистика:")
    print(f"   • Пользователей: {len(users)}")
    print(f"   • Документов: {len(documents)}")
    print(f"   • Запросов: {len(queries)}")
    print(f"   • Показов: {len(impressions)}")
    print(f"   • Кликов: {len(clicks)}")
    print(f"   • CTR: {len(clicks) / len(impressions) * 100:.2f}%")
    print("\n✅ Следующий шаг: загрузка документов в OpenSearch")
    print("   Запусти: python scripts/load_to_opensearch.py")


if __name__ == "__main__":
    main()