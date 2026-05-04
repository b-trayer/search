#!/usr/bin/env python3

import argparse
import json
import random
import hashlib
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict
from datetime import datetime

NSU_STRUCTURE = {
    "Физический факультет": {
        "code": "FF",
        "directions": ["Физика", "Физическая информатика", "Прикладные математика и физика"]
    },
    "Механико-математический факультет": {
        "code": "MMF",
        "directions": ["Математика", "Математика и компьютерные науки",
                       "Прикладная математика и информатика", "Механика и математическое моделирование"]
    },
    "Геолого-геофизический факультет": {
        "code": "GGF",
        "directions": ["Геология", "Геофизика", "Геохимия", "Геология нефти и газа"]
    },
    "Факультет естественных наук": {
        "code": "FEN",
        "directions": ["Биология", "Молекулярная биология", "Цитология и генетика", "Физиология",
                       "Химия", "Органическая химия", "Неорганическая химия", "Физическая химия",
                       "Аналитическая химия", "Катализ"]
    },
    "Факультет информационных технологий": {
        "code": "FIT",
        "directions": ["Программная инженерия и компьютерные науки", "Компьютерные науки и системотехника"]
    },
    "Экономический факультет": {
        "code": "EF",
        "directions": ["Экономика", "Менеджмент", "Социология", "Бизнес-информатика"]
    },
    "Гуманитарный институт": {
        "code": "GI",
        "directions": ["История", "Филология", "Журналистика", "Востоковедение и африканистика",
                       "Лингвистика", "Фундаментальная и прикладная лингвистика"]
    },
    "Институт медицины и медицинских технологий": {
        "code": "IMMT",
        "directions": ["Лечебное дело", "Медицинская кибернетика", "Психология", "Клиническая психология"]
    },
    "Институт философии и права": {
        "code": "IFP",
        "directions": ["Философия", "Юриспруденция"]
    },
    "Институт интеллектуальной робототехники": {
        "code": "IIR",
        "directions": ["Мехатроника и робототехника", "Прикладной искусственный интеллект"]
    },
}

USER_ROLES = [
    {"role": "bachelor", "role_ru": "Студент-бакалавр", "year_range": (1, 4), "degree": "bachelor"},
    {"role": "master", "role_ru": "Студент-магистрант", "year_range": (1, 2), "degree": "master"},
    {"role": "phd", "role_ru": "Аспирант", "year_range": (1, 4), "degree": "phd"},
    {"role": "professor", "role_ru": "Преподаватель", "year_range": None, "degree": None},
]

FIRST_NAMES_MALE = [
    "Александр", "Дмитрий", "Максим", "Артём", "Иван", "Михаил", "Даниил",
    "Кирилл", "Андрей", "Егор", "Никита", "Илья", "Алексей", "Матвей",
    "Тимофей", "Роман", "Владимир", "Ярослав", "Фёдор", "Георгий",
    "Константин", "Лев", "Николай", "Степан", "Марк", "Павел", "Пётр",
    "Денис", "Сергей", "Антон", "Олег", "Виктор", "Евгений", "Григорий",
]

FIRST_NAMES_FEMALE = [
    "Анастасия", "Мария", "Дарья", "Софья", "Анна", "Виктория", "Полина",
    "Елизавета", "Екатерина", "Ксения", "Валерия", "Алиса", "Вероника",
    "Александра", "Варвара", "Ульяна", "Арина", "Милана", "Ева", "Алёна",
    "Кристина", "Юлия", "Татьяна", "Наталья", "Ольга", "Ирина", "Елена",
    "Светлана", "Людмила", "Надежда", "Маргарита", "Валентина", "Лариса",
]

LAST_NAMES_MALE = [
    "Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", "Петров",
    "Соколов", "Михайлов", "Новиков", "Фёдоров", "Морозов", "Волков",
    "Алексеев", "Лебедев", "Семёнов", "Егоров", "Павлов", "Козлов",
    "Степанов", "Николаев", "Орлов", "Андреев", "Макаров", "Никитин",
    "Захаров", "Зайцев", "Соловьёв", "Борисов", "Яковлев", "Григорьев",
    "Романов", "Воробьёв", "Сергеев", "Кузьмин", "Фролов", "Александров",
    "Дмитриев", "Королёв", "Гусев", "Киселёв", "Ильин", "Максимов",
]

LAST_NAMES_FEMALE = [
    "Иванова", "Смирнова", "Кузнецова", "Попова", "Васильева", "Петрова",
    "Соколова", "Михайлова", "Новикова", "Фёдорова", "Морозова", "Волкова",
    "Алексеева", "Лебедева", "Семёнова", "Егорова", "Павлова", "Козлова",
    "Степанова", "Николаева", "Орлова", "Андреева", "Макарова", "Никитина",
    "Захарова", "Зайцева", "Соловьёва", "Борисова", "Яковлева", "Григорьева",
    "Романова", "Воробьёва", "Сергеева", "Кузьмина", "Фролова", "Александрова",
    "Дмитриева", "Королёва", "Гусева", "Киселёва", "Ильина", "Максимова",
]

PATRONYMICS_MALE = [
    "Александрович", "Дмитриевич", "Максимович", "Артёмович", "Иванович",
    "Михайлович", "Андреевич", "Сергеевич", "Алексеевич", "Николаевич",
    "Владимирович", "Евгеньевич", "Петрович", "Павлович", "Игоревич",
    "Олегович", "Викторович", "Романович", "Константинович", "Борисович",
]

PATRONYMICS_FEMALE = [
    "Александровна", "Дмитриевна", "Максимовна", "Артёмовна", "Ивановна",
    "Михайловна", "Андреевна", "Сергеевна", "Алексеевна", "Николаевна",
    "Владимировна", "Евгеньевна", "Петровна", "Павловна", "Игоревна",
    "Олеговна", "Викторовна", "Романовна", "Константиновна", "Борисовна",
]

ACADEMIC_DEGREES = [None, "Кандидат наук", "Кандидат наук", "Кандидат наук", "Доктор наук"]
ACADEMIC_TITLES = [None, "Доцент", "Доцент", "Профессор"]
POSITIONS = ["Старший преподаватель", "Доцент", "Профессор", "Заведующий кафедрой",
             "Научный сотрудник", "Старший научный сотрудник", "Ведущий научный сотрудник"]

DIRECTION_TO_TOPIC = {
    "Физика": "Физика", "Физическая информатика": "Физика", "Прикладные математика и физика": "Физика",
    "Математика": "Математика", "Математика и компьютерные науки": "Математика",
    "Прикладная математика и информатика": "Математика", "Механика и математическое моделирование": "Математика",
    "Геология": "Геология", "Геофизика": "Геология", "Геохимия": "Геология", "Геология нефти и газа": "Геология",
    "Биология": "Биология", "Молекулярная биология": "Биология", "Цитология и генетика": "Биология",
    "Физиология": "Биология", "Химия": "Химия", "Органическая химия": "Химия", "Неорганическая химия": "Химия",
    "Физическая химия": "Химия", "Аналитическая химия": "Химия", "Катализ": "Химия",
    "Программная инженерия и компьютерные науки": "Информатика", "Компьютерные науки и системотехника": "Информатика",
    "Экономика": "Экономика", "Менеджмент": "Экономика", "Социология": "Экономика", "Бизнес-информатика": "Экономика",
    "История": "История", "Филология": "Филология", "Журналистика": "Филология",
    "Востоковедение и африканистика": "Востоковедение и африканистика",
    "Лингвистика": "Филология", "Фундаментальная и прикладная лингвистика": "Филология",
    "Лечебное дело": "Биология", "Медицинская кибернетика": "Информатика",
    "Психология": "Философия", "Клиническая психология": "Философия",
    "Философия": "Философия", "Юриспруденция": "Право",
    "Мехатроника и робототехника": "Информатика", "Прикладной искусственный интеллект": "Информатика",
}


@dataclass
class User:
    id: str
    email: str
    first_name: str
    last_name: str
    patronymic: str
    full_name: str
    gender: str
    role: str
    role_ru: str
    faculty: str
    faculty_code: str
    direction: str
    topic: str
    year: Optional[int] = None
    degree: Optional[str] = None
    academic_degree: Optional[str] = None
    academic_title: Optional[str] = None
    position: Optional[str] = None
    created_at: str = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


class UserGenerator:
    def __init__(self, seed=42):
        random.seed(seed)
        self.used_emails = set()
        self.counter = 0

    def generate_person(self):
        gender = random.choice(["male", "female"])
        if gender == "male":
            first_name = random.choice(FIRST_NAMES_MALE)
            last_name = random.choice(LAST_NAMES_MALE)
            patronymic = random.choice(PATRONYMICS_MALE)
        else:
            first_name = random.choice(FIRST_NAMES_FEMALE)
            last_name = random.choice(LAST_NAMES_FEMALE)
            patronymic = random.choice(PATRONYMICS_FEMALE)
        return first_name, last_name, patronymic, gender

    def transliterate(self, text):
        translit_map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
            'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
            'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
            'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
            'э': 'e', 'ю': 'yu', 'я': 'ya',
        }
        result = ""
        for char in text.lower():
            result += translit_map.get(char, char)
        return result

    def generate_email(self, first_name, last_name, faculty_code):
        base = f"{self.transliterate(first_name[0])}.{self.transliterate(last_name)}"
        email = f"{base}@g.nsu.ru"
        counter = 1
        while email in self.used_emails:
            email = f"{base}{counter}@g.nsu.ru"
            counter += 1
        self.used_emails.add(email)
        return email

    def generate_id(self, faculty_code, role, direction):
        self.counter += 1
        base = f"{faculty_code}_{role}_{self.counter}"
        return hashlib.md5(base.encode()).hexdigest()[:12]

    def generate_user(self, faculty, faculty_code, direction, role_info):
        first_name, last_name, patronymic, gender = self.generate_person()
        full_name = f"{last_name} {first_name} {patronymic}"
        email = self.generate_email(first_name, last_name, faculty_code)
        user_id = self.generate_id(faculty_code, role_info["role"], direction)

        year = None
        if role_info["year_range"]:
            year = random.randint(*role_info["year_range"])

        academic_degree = None
        academic_title = None
        position = None
        if role_info["role"] == "professor":
            academic_degree = random.choice(ACADEMIC_DEGREES)
            academic_title = random.choice(ACADEMIC_TITLES)
            position = random.choice(POSITIONS)

        topic = DIRECTION_TO_TOPIC.get(direction, direction)

        return User(
            id=user_id, email=email, first_name=first_name, last_name=last_name,
            patronymic=patronymic, full_name=full_name, gender=gender,
            role=role_info["role"], role_ru=role_info["role_ru"],
            faculty=faculty, faculty_code=faculty_code, direction=direction, topic=topic,
            year=year, degree=role_info["degree"], academic_degree=academic_degree,
            academic_title=academic_title, position=position,
        )

    def generate_all_users(self):
        users = []
        for faculty, info in NSU_STRUCTURE.items():
            faculty_code = info["code"]
            for direction in info["directions"]:
                for role_info in USER_ROLES:
                    user = self.generate_user(faculty, faculty_code, direction, role_info)
                    users.append(user)
        return users


def main():
    parser = argparse.ArgumentParser(description="NSU user generator seeder")
    parser.add_argument("--output", "-o", type=str, default="nsu_users.json", help="Output file path")
    parser.add_argument("--format", "-f", choices=["json", "jsonl"], default="json", help="Output format")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()
    output_path = Path(args.output)

    print("NSU User Generator\n")

    total_faculties = len(NSU_STRUCTURE)
    total_directions = sum(len(info["directions"]) for info in NSU_STRUCTURE.values())
    total_users = total_directions * len(USER_ROLES)

    print(f"Faculties/Institutes: {total_faculties}")
    print(f"Programs: {total_directions}")
    print(f"Roles per program: {len(USER_ROLES)}")
    print(f"Total users: {total_users}\n")

    generator = UserGenerator(seed=args.seed)
    users = generator.generate_all_users()

    if args.format == "json":
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump([asdict(u) for u in users], f, ensure_ascii=False, indent=2)
    else:
        with open(output_path, "w", encoding="utf-8") as f:
            for user in users:
                f.write(json.dumps(asdict(user), ensure_ascii=False) + "\n")

    print(f"Saved {len(users)} users to {output_path}\n")

    print("By role:")
    role_counts = {}
    for user in users:
        role_counts[user.role_ru] = role_counts.get(user.role_ru, 0) + 1
    for role, count in role_counts.items():
        print(f"  {role}: {count}")

    print("\nBy faculty:")
    faculty_counts = {}
    for user in users:
        faculty_counts[user.faculty] = faculty_counts.get(user.faculty, 0) + 1
    for faculty, count in sorted(faculty_counts.items(), key=lambda x: -x[1]):
        print(f"  {faculty}: {count}")


if __name__ == "__main__":
    main()
