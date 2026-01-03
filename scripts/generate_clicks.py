#!/usr/bin/env python3

import random
import uuid
from datetime import datetime, timedelta
from collections import defaultdict
import psycopg
from opensearchpy import OpenSearch

PG_DSN = "postgresql://library_user:library_password@localhost:5432/library_search"
OPENSEARCH_HOST = "localhost"
OPENSEARCH_PORT = 9200

RESULTS_PER_QUERY = 10
DAYS_HISTORY = 180

USER_ACTIVITY_CLASSES = {
    "power_user": {"fraction": 0.10, "queries": (30, 60)},
    "active": {"fraction": 0.20, "queries": (15, 30)},
    "regular": {"fraction": 0.40, "queries": (5, 15)},
    "casual": {"fraction": 0.30, "queries": (1, 5)},
}

SPECIALIZATION_QUERIES = {
    "Математика": [
        "математический анализ", "линейная алгебра", "дифференциальные уравнения",
        "теория вероятностей", "математическая статистика", "дискретная математика",
        "функциональный анализ", "теория чисел", "топология", "геометрия",
        "численные методы", "оптимизация", "математическое моделирование"
    ],
    "Физика": [
        "квантовая механика", "термодинамика", "электродинамика", "оптика",
        "ядерная физика", "физика твердого тела", "теоретическая физика",
        "механика", "статистическая физика", "астрофизика", "физика плазмы"
    ],
    "Информатика": [
        "алгоритмы", "структуры данных", "машинное обучение", "нейронные сети",
        "базы данных", "операционные системы", "компьютерные сети",
        "программирование", "искусственный интеллект", "компьютерное зрение",
        "обработка естественного языка", "криптография", "параллельные вычисления"
    ],
    "Химия": [
        "органическая химия", "неорганическая химия", "аналитическая химия",
        "физическая химия", "биохимия", "квантовая химия", "электрохимия",
        "полимеры", "катализ", "химическая термодинамика"
    ],
    "Биология": [
        "генетика", "молекулярная биология", "экология", "эволюция",
        "микробиология", "биотехнология", "клеточная биология", "физиология",
        "ботаника", "зоология", "биоинформатика", "нейробиология"
    ],
    "Экономика": [
        "микроэкономика", "макроэкономика", "эконометрика", "финансы",
        "бухгалтерский учет", "менеджмент", "маркетинг", "экономическая теория",
        "международная экономика", "банковское дело", "инвестиции"
    ],
    "Филология": [
        "русский язык", "литературоведение", "лингвистика", "фонетика",
        "морфология", "синтаксис", "история языка", "стилистика",
        "зарубежная литература", "русская литература", "теория перевода"
    ],
    "История": [
        "история России", "всемирная история", "археология", "этнография",
        "средневековье", "новейшая история", "история культуры", "историография",
        "древняя история", "история искусства"
    ],
    "Право": [
        "гражданское право", "уголовное право", "конституционное право",
        "административное право", "трудовое право", "международное право",
        "теория государства", "римское право", "судебная система"
    ],
    "Геология": [
        "минералогия", "петрография", "геохимия", "палеонтология",
        "тектоника", "геофизика", "гидрогеология", "геология нефти"
    ],
}

COMMON_QUERIES = [
    "учебник", "курсовая работа", "диплом", "методичка", "лекции",
    "практикум", "задачник", "справочник", "словарь", "энциклопедия"
]

ROLE_TYPE_PREFERENCES = {
    "student": {"textbook": 0.3, "Учебник": 0.3, "book": 0.2, "manual": 0.2},
    "master": {"textbook": 0.2, "book": 0.2, "article": 0.2, "dissertation": 0.15},
    "phd": {"dissertation": 0.3, "article": 0.3, "journal_article": 0.25},
    "professor": {"article": 0.3, "journal_article": 0.3, "book": 0.2},
}

SPECIALIZATION_KEYWORDS = {
    "Математика": ["математ", "алгебр", "геометр", "анализ", "числ", "тополог", "вероятност", "статистик"],
    "Физика": ["физик", "механик", "оптик", "квант", "термо", "электро", "ядер", "астро"],
    "Информатика": ["информатик", "информацион", "программ", "алгоритм", "компьютер", "вычислит", "данных", "сет"],
    "Химия": ["хими", "органич", "неорганич", "аналитич", "электрохим", "полимер"],
    "Биология": ["биолог", "генетик", "эколог", "молекуляр", "клеточ", "физиолог", "микробиолог"],
    "Экономика": ["экономик", "финанс", "бухгалтер", "менеджмент", "маркетинг", "банк"],
    "Филология": ["филолог", "лингвист", "литератур", "язык", "языкозн", "перевод"],
    "История": ["истор", "археолог", "этнограф", "древн"],
    "Право": ["право", "юридич", "закон", "граждан", "уголов", "конституц"],
    "Геология": ["геолог", "минерал", "петрограф", "геохим", "тектон"],
}


def create_opensearch_client():
    return OpenSearch(
        hosts=[{"host": OPENSEARCH_HOST, "port": OPENSEARCH_PORT}],
        http_compress=True,
        timeout=30,
    )


def search_documents(client, query, size=10):
    try:
        response = client.search(
            index="library_documents",
            body={
                "query": {
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "authors^2", "subjects", "knowledge_area"],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }
                },
                "size": size,
                "_source": ["document_id", "title", "document_type", "knowledge_area", "subjects"]
            }
        )
        return [hit["_source"] for hit in response["hits"]["hits"]]
    except Exception as e:
        print(f"  Search error '{query}': {e}")
        return []


def find_hit_documents(client, specializations, hits_per_spec=5):
    hit_docs = {}
    for spec in specializations:
        queries = SPECIALIZATION_QUERIES.get(spec, [])
        if not queries:
            continue
        all_docs = []
        for q in queries[:3]:
            results = search_documents(client, q, size=5)
            all_docs.extend(results)
        seen = set()
        unique_docs = []
        for doc in all_docs:
            doc_id = doc.get("document_id", "")[:50]
            if doc_id and doc_id not in seen:
                seen.add(doc_id)
                unique_docs.append(doc_id)
        hit_docs[spec] = unique_docs[:hits_per_spec]
    return hit_docs


def find_super_hits(client, count=5):
    super_hit_queries = ["учебное пособие", "справочник", "основы", "введение в", "курс лекций"]
    all_docs = []
    for q in super_hit_queries:
        results = search_documents(client, q, size=3)
        all_docs.extend(results)
    seen = set()
    unique_docs = []
    for doc in all_docs:
        doc_id = doc.get("document_id", "")[:50]
        if doc_id and doc_id not in seen:
            seen.add(doc_id)
            unique_docs.append(doc)
    return unique_docs[:count]


def get_super_hit_ids(super_hits):
    return [doc.get("document_id", "")[:50] for doc in super_hits]


def assign_user_activity_class(user_index, total_users):
    position = user_index / total_users
    cumulative = 0
    for class_name, params in USER_ACTIVITY_CLASSES.items():
        cumulative += params["fraction"]
        if position < cumulative:
            return class_name
    return "casual"


def get_queries_for_user(activity_class):
    params = USER_ACTIVITY_CLASSES[activity_class]
    return random.randint(*params["queries"])


def generate_realistic_timestamp(days_back=180):
    now = datetime.now()
    month_weights = {
        1: 2.0, 2: 1.2, 3: 1.0, 4: 1.0, 5: 1.3, 6: 2.0,
        7: 0.3, 8: 0.4, 9: 2.5, 10: 1.5, 11: 1.2, 12: 1.5,
    }
    attempts = 0
    while attempts < 100:
        random_days = random.random() * days_back
        dt = now - timedelta(days=random_days)
        month_weight = month_weights.get(dt.month, 1.0)
        if random.random() < month_weight / 2.5:
            break
        attempts += 1

    day_of_week = dt.weekday()
    if day_of_week >= 5:
        if random.random() < 0.70:
            target_weekday = random.randint(0, 4)
            days_diff = target_weekday - day_of_week
            if days_diff <= 0:
                days_diff += 7
            dt = dt + timedelta(days=days_diff)

    hour_weights = {
        8: 0.3, 9: 0.7, 10: 1.0, 11: 1.0, 12: 0.8,
        13: 0.5, 14: 0.9, 15: 1.0, 16: 1.0, 17: 0.8,
        18: 0.6, 19: 0.5, 20: 0.4, 21: 0.3, 22: 0.2
    }
    hours = list(hour_weights.keys())
    weights = list(hour_weights.values())
    hour = random.choices(hours, weights=weights)[0]
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return dt.replace(hour=hour, minute=minute, second=second)


def is_topic_match(user_specialization, doc_text):
    if not user_specialization or not doc_text:
        return False
    doc_lower = doc_text.lower()
    keywords = SPECIALIZATION_KEYWORDS.get(user_specialization, [])
    for kw in keywords:
        if kw in doc_lower:
            return True
    return False


def calculate_click_probability(position, doc_id, doc_type, user_role, doc_subject,
                                 user_specialization, hit_docs, super_hits):
    position_bias = 1.0 / ((position + 0.5) ** 0.6)

    if doc_id in super_hits:
        return min(0.90, position_bias * 0.95)

    hit_bonus = 0.0
    user_hits = hit_docs.get(user_specialization, [])
    if doc_id in user_hits:
        hit_bonus = 0.40

    topic_match = is_topic_match(user_specialization, doc_subject)
    topic_weight = 0.45 if topic_match else 0.05

    type_prefs = ROLE_TYPE_PREFERENCES.get(user_role, {})
    type_weight = 0.10 * type_prefs.get(doc_type, 0.1)

    base = 0.08
    prob = position_bias * (topic_weight + type_weight + base + hit_bonus)
    return min(0.85, max(0.01, prob))


def generate_dwell_time(is_relevant, is_hit):
    if is_hit:
        return random.randint(60, 600)
    elif is_relevant:
        return random.randint(30, 300)
    else:
        return random.randint(5, 45)


def main():
    print("=" * 70)
    print("  REALISTIC CLICK HISTORY GENERATOR")
    print("=" * 70)

    os_client = create_opensearch_client()

    try:
        info = os_client.info()
        print(f"\nOpenSearch: {info['version']['number']}")
    except Exception as e:
        print(f"OpenSearch connection error: {e}")
        return

    with psycopg.connect(PG_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT user_id, username, role, specialization, interests
                FROM users ORDER BY user_id
            """)
            users = cur.fetchall()
            print(f"Users: {len(users)}")

            print("\nFinding hit documents...")
            all_specs = list(set(u[3] for u in users if u[3]))
            hit_docs = find_hit_documents(os_client, all_specs, hits_per_spec=5)
            print(f"  Found hits for {len(hit_docs)} specializations")

            print("Finding super-hits...")
            super_hits = find_super_hits(os_client, count=5)
            super_hit_ids = get_super_hit_ids(super_hits)
            print(f"  Found {len(super_hits)} super-hits")
            for sh in super_hits:
                print(f"    - {sh.get('title', '')[:50]}...")

            print("\nClearing old data...")
            cur.execute("DELETE FROM clicks")
            cur.execute("DELETE FROM impressions")
            cur.execute("DELETE FROM search_queries")
            conn.commit()

            total_queries = 0
            total_impressions = 0
            total_clicks = 0
            activity_stats = defaultdict(int)

            print("\nGenerating data...")

            for idx, (user_id, username, role, specialization, interests) in enumerate(users):
                activity_class = assign_user_activity_class(idx, len(users))
                activity_stats[activity_class] += 1
                num_queries = get_queries_for_user(activity_class)

                query_pool = list(COMMON_QUERIES)
                if specialization and specialization in SPECIALIZATION_QUERIES:
                    query_pool.extend(SPECIALIZATION_QUERIES[specialization] * 3)
                if interests:
                    for interest in interests[:3]:
                        if interest in SPECIALIZATION_QUERIES:
                            query_pool.extend(SPECIALIZATION_QUERIES[interest])

                session_id = str(uuid.uuid4())[:8]
                session_queries = 0
                last_timestamp = None

                for _ in range(num_queries):
                    session_queries += 1
                    if session_queries > random.randint(3, 7):
                        session_id = str(uuid.uuid4())[:8]
                        session_queries = 1
                        last_timestamp = None

                    query_text = random.choice(query_pool)

                    if last_timestamp and session_queries > 1:
                        timestamp = last_timestamp + timedelta(minutes=random.randint(1, 15))
                    else:
                        timestamp = generate_realistic_timestamp(DAYS_HISTORY)
                    last_timestamp = timestamp

                    results = search_documents(os_client, query_text, RESULTS_PER_QUERY)
                    if not results:
                        continue

                    if random.random() < 0.5 and super_hits:
                        super_hit = random.choice(super_hits)
                        insert_pos = random.randint(0, min(2, len(results)))
                        results = [r for r in results if r.get("document_id") != super_hit.get("document_id")]
                        results.insert(insert_pos, super_hit)
                        results = results[:RESULTS_PER_QUERY]

                    cur.execute("""
                        INSERT INTO search_queries (user_id, query_text, results_count, timestamp, session_id)
                        VALUES (%s, %s, %s, %s, %s) RETURNING query_id
                    """, (user_id, query_text, len(results), timestamp, session_id))
                    query_id = cur.fetchone()[0]
                    total_queries += 1

                    for position, doc in enumerate(results, 1):
                        doc_id = doc.get("document_id", "")[:50]
                        doc_type = doc.get("document_type", "")
                        doc_subject = doc.get("knowledge_area", "") or ""
                        if doc.get("subjects"):
                            doc_subject += " " + " ".join(doc["subjects"][:3])

                        cur.execute("""
                            INSERT INTO impressions
                            (query_id, user_id, document_id, query_text, position, shown_at, session_id)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (query_id, user_id, doc_id, query_text, position, timestamp, session_id))
                        total_impressions += 1

                        click_prob = calculate_click_probability(
                            position, doc_id, doc_type, role,
                            doc_subject, specialization, hit_docs, super_hit_ids
                        )

                        if random.random() < click_prob:
                            click_time = timestamp + timedelta(seconds=random.randint(1, 8) * position)
                            is_relevant = is_topic_match(specialization, doc_subject)
                            is_hit = doc_id in hit_docs.get(specialization, []) or doc_id in super_hit_ids
                            dwell_time = generate_dwell_time(is_relevant, is_hit)

                            cur.execute("""
                                INSERT INTO clicks
                                (query_id, user_id, document_id, query_text, position, clicked_at, dwell_time, session_id)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """, (query_id, user_id, doc_id, query_text, position, click_time, dwell_time, session_id))
                            total_clicks += 1

                    conn.commit()

                if (idx + 1) % 20 == 0:
                    print(f"  Processed: {idx + 1}/{len(users)}")

            print("\nUpdating CTR statistics...")
            try:
                cur.execute("REFRESH MATERIALIZED VIEW ctr_stats")
                conn.commit()
            except Exception as e:
                print(f"  Error: {e}")

            print("\n" + "=" * 70)
            print("  RESULTS")
            print("=" * 70)
            print(f"\n  User activity classes:")
            for cls, cnt in sorted(activity_stats.items()):
                print(f"    {cls}: {cnt}")
            print(f"\n  Search queries: {total_queries}")
            print(f"  Impressions: {total_impressions}")
            print(f"  Clicks: {total_clicks}")
            if total_impressions > 0:
                print(f"  Average CTR: {100 * total_clicks / total_impressions:.2f}%")
            print("=" * 70)


if __name__ == "__main__":
    main()
