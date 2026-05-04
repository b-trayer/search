#!/usr/bin/env python3
import json
import psycopg

PG_DSN = "postgresql://library_user:library_password@localhost:5432/library_search"

with open("nsu_users.json") as f:
    users = json.load(f)

with psycopg.connect(PG_DSN) as conn:
    cur = conn.cursor()
    for u in users:
        cur.execute(
            "INSERT INTO users (username, email, role, specialization, faculty, course) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (username) DO NOTHING",
            (u["full_name"], u["email"], u["role"], u.get("topic"), u.get("faculty"), u.get("year"))
        )
    conn.commit()
    cur.execute("SELECT COUNT(*) FROM users")
    print("Users:", cur.fetchone()[0])
