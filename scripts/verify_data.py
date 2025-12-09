#!/usr/bin/env python3
"""
Скрипт проверки сгенерированных данных
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import psycopg2
from tabulate import tabulate

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'library_search',
    'user': 'library_user',
    'password': 'library_password'
}


def check_database():
    """Проверка данных в PostgreSQL"""
    print("=" * 70)
    print("🔍 ПРОВЕРКА ДАННЫХ В POSTGRESQL")
    print("=" * 70)
    print()

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Статистика таблиц
        print("📊 Статистика таблиц:")
        print()

        tables = ['users', 'documents', 'search_queries', 'impressions', 'clicks']
        stats = []

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            stats.append([table, count])

        print(tabulate(stats, headers=['Таблица', 'Записей'], tablefmt='grid'))
        print()

        # Пользователи по ролям
        print("👥 Распределение пользователей по ролям:")
        cursor.execute("""
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        """)
        roles = cursor.fetchall()
        print(tabulate(roles, headers=['Роль', 'Количество'], tablefmt='grid'))
        print()

        # Документы по типам
        print("📚 Распределение документов по типам:")
        cursor.execute("""
            SELECT document_type, COUNT(*) as count
            FROM documents
            GROUP BY document_type
            ORDER BY count DESC
        """)
        doc_types = cursor.fetchall()
        print(tabulate(doc_types, headers=['Тип', 'Количество'], tablefmt='grid'))
        print()

        # Документы по предметам (топ-5)
        print("📖 Топ-5 предметов:")
        cursor.execute("""
            SELECT subject, COUNT(*) as count
            FROM documents
            GROUP BY subject
            ORDER BY count DESC
            LIMIT 5
        """)
        subjects = cursor.fetchall()
        print(tabulate(subjects, headers=['Предмет', 'Документов'], tablefmt='grid'))
        print()

        # CTR статистика
        print("📈 Статистика CTR (топ-10 запросов):")
        cursor.execute("""
            SELECT 
                query_text,
                impressions_count,
                clicks_count,
                ROUND(ctr * 100, 2) as ctr_percent
            FROM ctr_stats
            ORDER BY clicks_count DESC
            LIMIT 10
        """)
        ctr = cursor.fetchall()
        if ctr:
            print(tabulate(ctr, headers=['Запрос', 'Показы', 'Клики', 'CTR %'], tablefmt='grid'))
        else:
            print("⚠️  Нет данных в ctr_stats")
        print()

        # Примеры документов
        print("📄 Примеры документов (первые 3):")
        cursor.execute("""
            SELECT document_id, title, document_type, year, subject
            FROM documents
            LIMIT 3
        """)
        docs = cursor.fetchall()
        for doc in docs:
            doc_id, title, dtype, year, subj = doc
            print(f"\n  ID: {doc_id}")
            print(f"  Название: {title[:70]}...")
            print(f"  Тип: {dtype} | Год: {year} | Предмет: {subj}")
        print()

        # Примеры пользователей
        print("👤 Примеры пользователей (первые 3):")
        cursor.execute("""
            SELECT username, role, specialization, course
            FROM users
            LIMIT 3
        """)
        users = cursor.fetchall()
        for user in users:
            uname, role, spec, course = user
            print(f"\n  Username: {uname}")
            print(f"  Роль: {role} | Специализация: {spec} | Курс: {course or 'N/A'}")
        print()

        cursor.close()
        conn.close()

        print("=" * 70)
        print("✅ ПРОВЕРКА ЗАВЕРШЕНА")
        print("=" * 70)

    except Exception as e:
        print(f"❌ Ошибка: {e}")


if __name__ == "__main__":
    try:
        check_database()
    except KeyboardInterrupt:
        print("\n\n⚠️  Проверка прервана")