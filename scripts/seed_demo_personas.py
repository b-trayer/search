#!/usr/bin/env python3
import os
import sys

import psycopg

PG_DSN = os.environ.get(
    "POSTGRES_DSN",
    "postgresql://library_user:library_password@localhost:5432/library_search",
)

DEMO_PERSONAS = [
    {
        "username": "Алина Соловьева",
        "email": "a.soloveva@nsu.ru",
        "role": "bachelor",
        "specialization": "Филология",
        "faculty": "Гуманитарный институт",
        "course": 3,
        "interests": [
            "русская литература XIX века",
            "Толстой",
            "Достоевский",
        ],
    },
    {
        "username": "Артем Лебедев",
        "email": "a.lebedev@nsu.ru",
        "role": "master",
        "specialization": "Геология",
        "faculty": "Геолого-геофизический факультет",
        "course": 1,
        "interests": [
            "геофизика",
            "тектоника",
            "строение Земли",
        ],
    },
    {
        "username": "Дарья Соколова",
        "email": "d.sokolova@nsu.ru",
        "role": "bachelor",
        "specialization": "Право",
        "faculty": "Институт философии и права",
        "course": 2,
        "interests": [
            "конституционное право",
            "права человека",
            "судебная система",
        ],
    },
]


def upsert(conn: psycopg.Connection, persona: dict) -> str:
    cur = conn.cursor()
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
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
        """,
        (
            persona["username"],
            persona["email"],
            persona["role"],
            persona["specialization"],
            persona["faculty"],
            persona["course"],
            persona["interests"],
        ),
    )
    inserted = cur.fetchone()[0]
    return "inserted" if inserted else "updated"


def main() -> int:
    with psycopg.connect(PG_DSN) as conn:
        for persona in DEMO_PERSONAS:
            status = upsert(conn, persona)
            print(f"  [{status:8s}] {persona['username']:24s}  ({persona['role']}, {persona['specialization']})")
        conn.commit()

        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        total = cur.fetchone()[0]
        print(f"\nTotal users in database: {total}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
