#!/usr/bin/env python3

import psycopg

PG_DSN = "postgresql://library_user:library_password@localhost:5432/library_search"

PERSONAS = [
    {
        "username": "Иван Петров",
        "email": "i.petrov@g.nsu.ru",
        "role": "bachelor",
        "specialization": "Физика",
        "faculty": "Физический факультет",
        "course": 2,
        "interests": ["механика", "оптика", "лазер"],
    },
    {
        "username": "Мария Соколова",
        "email": "m.sokolova@g.nsu.ru",
        "role": "bachelor",
        "specialization": "Математика",
        "faculty": "Механико-математический факультет",
        "course": 3,
        "interests": ["алгебра", "геометрия", "анализ"],
    },
    {
        "username": "Алексей Орлов",
        "email": "a.orlov@g.nsu.ru",
        "role": "master",
        "specialization": "Информатика",
        "faculty": "Факультет информационных технологий",
        "course": 1,
        "interests": ["машинное обучение", "нейронные сети"],
    },
    {
        "username": "Анна Громова",
        "email": "a.gromova@g.nsu.ru",
        "role": "master",
        "specialization": "Биология",
        "faculty": "Факультет естественных наук",
        "course": 2,
        "interests": ["генетика", "молекулярная биология", "экология"],
    },
    {
        "username": "Дмитрий Соколов",
        "email": "d.sokolov@g.nsu.ru",
        "role": "phd",
        "specialization": "Физика",
        "faculty": "Физический факультет",
        "course": None,
        "interests": ["квантовая теория", "ядерная физика", "элементарные частицы"],
    },
    {
        "username": "Кирилл Лебедев",
        "email": "k.lebedev@g.nsu.ru",
        "role": "phd",
        "specialization": "Химия",
        "faculty": "Факультет естественных наук",
        "course": None,
        "interests": ["органический синтез", "катализ"],
    },
    {
        "username": "Елена Морозова",
        "email": "e.morozova@g.nsu.ru",
        "role": "phd",
        "specialization": "История",
        "faculty": "Гуманитарный институт",
        "course": None,
        "interests": ["археология", "Сибирь", "древняя Русь"],
    },
    {
        "username": "Виктор Орлов",
        "email": "v.orlov@nsu.ru",
        "role": "professor",
        "specialization": "Физика",
        "faculty": "Физический факультет",
        "course": None,
        "interests": ["электродинамика", "квантовая механика", "теоретическая физика"],
    },
    {
        "username": "Ольга Кузнецова",
        "email": "o.kuznetsova@nsu.ru",
        "role": "professor",
        "specialization": "История",
        "faculty": "Гуманитарный институт",
        "course": None,
        "interests": ["средневековье", "источниковедение", "историография"],
    },
    {
        "username": "Сергей Никитин",
        "email": "s.nikitin@nsu.ru",
        "role": "professor",
        "specialization": "Экономика",
        "faculty": "Экономический факультет",
        "course": None,
        "interests": ["финансы", "менеджмент", "макроэкономика"],
    },
    {
        "username": "Алина Соловьева",
        "email": "a.soloveva@nsu.ru",
        "role": "bachelor",
        "specialization": "Филология",
        "faculty": "Гуманитарный институт",
        "course": 3,
        "interests": ["русская литература XIX века", "Толстой", "Достоевский"],
    },
    {
        "username": "Артем Лебедев",
        "email": "a.lebedev@nsu.ru",
        "role": "master",
        "specialization": "Геология",
        "faculty": "Геолого-геофизический факультет",
        "course": 1,
        "interests": ["геофизика", "тектоника", "строение Земли"],
    },
    {
        "username": "Дарья Соколова",
        "email": "d.sokolova@nsu.ru",
        "role": "bachelor",
        "specialization": "Право",
        "faculty": "Институт философии и права",
        "course": 2,
        "interests": ["конституционное право", "права человека", "судебная система"],
    },
]


def main():
    with psycopg.connect(PG_DSN) as conn:
        cur = conn.cursor()
        for p in PERSONAS:
            cur.execute(
                """
                INSERT INTO users (username, email, role, specialization, faculty, course, interests)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE SET
                    email = EXCLUDED.email,
                    role = EXCLUDED.role,
                    specialization = EXCLUDED.specialization,
                    faculty = EXCLUDED.faculty,
                    course = EXCLUDED.course,
                    interests = EXCLUDED.interests,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    p["username"],
                    p["email"],
                    p["role"],
                    p["specialization"],
                    p["faculty"],
                    p["course"],
                    p["interests"],
                ),
            )
        conn.commit()

        cur.execute("SELECT user_id, username, role, specialization FROM users ORDER BY user_id;")
        rows = cur.fetchall()

    print(f"Loaded {len(rows)} personas:")
    for uid, name, role, spec in rows:
        print(f"  {uid:>3} | {role:<10} | {spec:<15} | {name}")


if __name__ == "__main__":
    main()
