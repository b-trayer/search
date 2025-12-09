#!/usr/bin/env python3
"""
Генерация реалистичных кликов для расчёта CTR
"""
import random
import uuid
import psycopg2
from datetime import datetime, timedelta

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "library_search",
    "user": "library_user",
    "password": "library_password"
}

# Запросы по специализациям (реалистичные поисковые запросы студентов НГУ)
QUERIES_BY_SPECIALIZATION = {
    "История": [
        "история России", "древняя Русь", "археология", "средневековье",
        "Великая Отечественная война", "история Сибири", "источниковедение",
        "история культуры", "всемирная история", "историография"
    ],
    "Филология": [
        "русская литература", "литературоведение", "поэтика", "Достоевский",
        "Пушкин", "современная литература", "теория литературы", "фольклор"
    ],
    "Философия": [
        "философия", "онтология", "эпистемология", "этика", "логика",
        "история философии", "Кант", "Платон", "феноменология"
    ],
    "Юриспруденция": [
        "гражданское право", "уголовное право", "конституционное право",
        "международное право", "трудовое право", "административное право"
    ],
    "Физический факультет": [
        "квантовая физика", "оптика", "термодинамика", "электродинамика",
        "физика твердого тела", "ядерная физика", "астрофизика", "механика"
    ],
    "Механико-математический факультет": [
        "математический анализ", "линейная алгебра", "дифференциальные уравнения",
        "теория вероятностей", "математическая статистика", "численные методы",
        "функциональный анализ", "геометрия", "топология"
    ],
    "Биология": [
        "генетика", "молекулярная биология", "экология", "микробиология",
        "биохимия", "физиология", "ботаника", "зоология", "эволюция"
    ],
    "Химия": [
        "органическая химия", "неорганическая химия", "аналитическая химия",
        "физическая химия", "биохимия", "химическая технология"
    ],
    "Факультет информационных технологий": [
        "программирование", "алгоритмы", "машинное обучение", "базы данных",
        "компьютерные сети", "операционные системы", "искусственный интеллект",
        "Python", "Java", "веб-разработка", "информационная безопасность"
    ],
    "Экономика": [
        "микроэкономика", "макроэкономика", "эконометрика", "финансы",
        "бухгалтерский учет", "менеджмент", "маркетинг", "статистика"
    ],
    "Психология": [
        "психология личности", "когнитивная психология", "клиническая психология",
        "социальная психология", "психодиагностика", "нейропсихология"
    ],
    "Лингвистика": [
        "языкознание", "фонетика", "морфология", "синтаксис", "семантика",
        "компьютерная лингвистика", "перевод", "иностранные языки"
    ],
    "Геология": [
        "геология", "минералогия", "петрология", "геохимия", "геофизика",
        "стратиграфия", "тектоника", "палеонтология", "нефть и газ"
    ],
    "Журналистика": [
        "журналистика", "СМИ", "медиа", "публицистика", "редактирование"
    ],
    "Лечебное дело": [
        "анатомия", "физиология", "терапия", "хирургия", "фармакология",
        "патология", "биохимия", "гистология"
    ],
    "Востоковедение и африканистика": [
        "востоковедение", "китайский язык", "японский язык", "история Азии",
        "культура Востока", "арабский язык"
    ]
}

# Общие запросы для всех
COMMON_QUERIES = [
    "учебник", "курсовая", "диплом", "реферат", "методичка",
    "лекции", "конспект", "экзамен", "практикум", "задачник"
]


def get_users(cursor):
    """Получить всех пользователей"""
    cursor.execute("""
        SELECT user_id, username, role, specialization, faculty, interests
        FROM users
    """)
    users = []
    for row in cursor.fetchall():
        users.append({
            "user_id": row[0],
            "username": row[1],
            "role": row[2],
            "specialization": row[3],
            "faculty": row[4],
            "interests": row[5] or []
        })
    return users


def search_documents(cursor, query, limit=20):
    """Поиск документов по запросу (простой LIKE)"""
    cursor.execute("""
        SELECT document_id, title
        FROM documents
        WHERE LOWER(title) LIKE LOWER(%s)
           OR LOWER(COALESCE(литература_по_отраслям_знания, '')) LIKE LOWER(%s)
           OR LOWER(COALESCE(коллекция, '')) LIKE LOWER(%s)
        LIMIT %s
    """, (f'%{query}%', f'%{query}%', f'%{query}%', limit))
    
    return [{"document_id": row[0], "title": row[1]} for row in cursor.fetchall()]


def generate_clicks_for_user(cursor, user, num_sessions=5):
    """Генерация сессий поиска для пользователя"""
    
    queries_data = []
    impressions_data = []
    clicks_data = []
    
    # Выбираем запросы для пользователя
    spec = user["specialization"]
    faculty = user["faculty"]
    
    # Запросы по специализации
    spec_queries = QUERIES_BY_SPECIALIZATION.get(spec, [])
    if not spec_queries:
        spec_queries = QUERIES_BY_SPECIALIZATION.get(faculty, [])
    if not spec_queries:
        spec_queries = COMMON_QUERIES
    
    # Добавляем общие запросы
    all_queries = spec_queries + COMMON_QUERIES
    
    for session_num in range(num_sessions):
        session_id = str(uuid.uuid4())
        
        # Время сессии (случайное за последние 30 дней)
        days_ago = random.randint(0, 30)
        session_time = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
        
        # 1-3 запроса за сессию
        num_queries = random.randint(1, 3)
        session_queries = random.sample(all_queries, min(num_queries, len(all_queries)))
        
        for query in session_queries:
            # Поиск документов
            docs = search_documents(cursor, query, limit=10)
            
            if not docs:
                continue
            
            # Сохраняем запрос
            queries_data.append({
                "user_id": user["user_id"],
                "query_text": query,
                "results_count": len(docs),
                "timestamp": session_time,
                "session_id": session_id
            })
            
            # Генерируем показы (impressions)
            for position, doc in enumerate(docs, 1):
                impressions_data.append({
                    "user_id": user["user_id"],
                    "document_id": doc["document_id"],
                    "query_text": query,
                    "position": position,
                    "shown_at": session_time,
                    "session_id": session_id
                })
            
            # Генерируем клики (с вероятностью, зависящей от позиции)
            for position, doc in enumerate(docs, 1):
                # Вероятность клика падает с позицией
                click_prob = 0.5 / position
                
                # Буст если документ релевантен специализации
                if any(interest.lower() in doc["title"].lower() for interest in user.get("interests", [])):
                    click_prob *= 1.5
                
                if random.random() < click_prob:
                    dwell_time = random.randint(10, 300) if random.random() > 0.3 else random.randint(5, 30)
                    
                    clicks_data.append({
                        "user_id": user["user_id"],
                        "document_id": doc["document_id"],
                        "query_text": query,
                        "position": position,
                        "clicked_at": session_time + timedelta(seconds=random.randint(1, 60)),
                        "dwell_time": dwell_time,
                        "session_id": session_id
                    })
    
    return queries_data, impressions_data, clicks_data


def main():
    print("=" * 60)
    print("🖱️  ГЕНЕРАЦИЯ КЛИКОВ ДЛЯ CTR")
    print("=" * 60)
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Очистка старых данных
        print("\n🗑️  Очистка старых данных...")
        cursor.execute("DELETE FROM clicks")
        cursor.execute("DELETE FROM impressions")
        cursor.execute("DELETE FROM search_queries")
        conn.commit()
        print("   ✅ Таблицы очищены")
        
        # Получаем пользователей
        users = get_users(cursor)
        print(f"\n👥 Найдено {len(users)} пользователей")
        
        all_queries = []
        all_impressions = []
        all_clicks = []
        
        # Генерируем данные для каждого пользователя
        print("\n🔄 Генерация сессий...")
        for i, user in enumerate(users):
            # Разное количество сессий в зависимости от роли
            if user["role"] == "student":
                num_sessions = random.randint(5, 15)
            elif user["role"] == "master":
                num_sessions = random.randint(8, 20)
            elif user["role"] == "phd":
                num_sessions = random.randint(10, 25)
            else:  # professor
                num_sessions = random.randint(5, 15)
            
            queries, impressions, clicks = generate_clicks_for_user(cursor, user, num_sessions)
            all_queries.extend(queries)
            all_impressions.extend(impressions)
            all_clicks.extend(clicks)
            
            if (i + 1) % 20 == 0:
                print(f"   Обработано: {i + 1}/{len(users)} пользователей")
        
        # Сохраняем запросы
        print(f"\n💾 Сохранение {len(all_queries)} запросов...")
        query_id_map = {}
        for q in all_queries:
            cursor.execute("""
                INSERT INTO search_queries (user_id, query_text, results_count, timestamp, session_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING query_id
            """, (q["user_id"], q["query_text"], q["results_count"], q["timestamp"], q["session_id"]))
            query_id = cursor.fetchone()[0]
            query_id_map[(q["session_id"], q["query_text"])] = query_id
        conn.commit()
        
        # Сохраняем показы
        print(f"💾 Сохранение {len(all_impressions)} показов...")
        for imp in all_impressions:
            query_id = query_id_map.get((imp["session_id"], imp["query_text"]))
            cursor.execute("""
                INSERT INTO impressions (query_id, user_id, document_id, query_text, position, shown_at, session_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (query_id, imp["user_id"], imp["document_id"], imp["query_text"], 
                  imp["position"], imp["shown_at"], imp["session_id"]))
        conn.commit()
        
        # Сохраняем клики
        print(f"💾 Сохранение {len(all_clicks)} кликов...")
        for click in all_clicks:
            query_id = query_id_map.get((click["session_id"], click["query_text"]))
            cursor.execute("""
                INSERT INTO clicks (query_id, user_id, document_id, query_text, position, clicked_at, dwell_time, session_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (query_id, click["user_id"], click["document_id"], click["query_text"],
                  click["position"], click["clicked_at"], click["dwell_time"], click["session_id"]))
        conn.commit()
        
        # Обновляем CTR статистику
        print("\n📊 Обновление CTR статистики...")
        cursor.execute("REFRESH MATERIALIZED VIEW ctr_stats")
        conn.commit()
        
        # Статистика
        print("\n" + "=" * 60)
        print("📈 СТАТИСТИКА")
        print("=" * 60)
        
        cursor.execute("SELECT COUNT(*) FROM search_queries")
        print(f"   Запросов: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM impressions")
        print(f"   Показов: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM clicks")
        print(f"   Кликов: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM ctr_stats")
        print(f"   Записей CTR: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT AVG(ctr) FROM ctr_stats WHERE ctr > 0")
        avg_ctr = cursor.fetchone()[0]
        if avg_ctr:
            print(f"   Средний CTR: {avg_ctr * 100:.1f}%")
        
        # Топ запросы
        print("\n🔥 Топ-10 запросов по количеству:")
        cursor.execute("""
            SELECT query_text, COUNT(*) as cnt
            FROM search_queries
            GROUP BY query_text
            ORDER BY cnt DESC
            LIMIT 10
        """)
        for row in cursor.fetchall():
            print(f"   {row[0]}: {row[1]} раз")
        
        # Топ документы по CTR
        print("\n⭐ Топ-10 документов по CTR:")
        cursor.execute("""
            SELECT c.document_id, d.title, c.ctr, c.clicks_count, c.impressions_count
            FROM ctr_stats c
            JOIN documents d ON c.document_id = d.document_id
            WHERE c.impressions_count >= 5
            ORDER BY c.ctr DESC
            LIMIT 10
        """)
        for row in cursor.fetchall():
            title = row[1][:40] + "..." if len(row[1]) > 40 else row[1]
            print(f"   {title}: CTR={row[2]*100:.0f}% ({row[3]}/{row[4]})")
        
        print("\n✅ Готово!")
        
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
