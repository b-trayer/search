#!/usr/bin/env python3
import requests
import sys
from tabulate import tabulate

API_BASE = "http://localhost:8000"

def check_api():
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ API доступен: {API_BASE}")
            return True
    except:
        pass
    print(f"❌ API недоступен: {API_BASE}")
    print("   Запустите сервер: make dev")
    sys.exit(1)

def test_basic_search():
    print("=" * 80)
    print("  1. БАЗОВЫЙ ПОИСК (без персонализации)")
    print("=" * 80)
    
    response = requests.post(
        f"{API_BASE}/api/search/",
        json={
            "query": "машинное обучение",
            "top_k": 5,
            "enable_personalization": False
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        return
    
    data = response.json()
    print(f"Запрос: '{data['query']}'")
    print(f"Найдено документов: {data['total']}")
    print(f"Персонализация: {data['personalized']}")
    print(f"\nТоп-5 результатов:")
    
    table = []
    for r in data['results'][:5]:
        table.append([
            r['position'],
            r['title'][:50] + '...',
            r['document_type'],
            r['year'],
            f"{r['final_score']:.2f}"
        ])
    
    print(tabulate(table, headers=['#', 'Название', 'Тип', 'Год', 'Скор'], tablefmt='grid'))

def test_personalized_search():
    print("\n" + "=" * 80)
    print("  2. ПЕРСОНАЛИЗИРОВАННЫЙ ПОИСК")
    print("=" * 80)
    
    # Получить пользователя
    users_response = requests.get(f"{API_BASE}/api/users/?limit=5")
    if users_response.status_code != 200:
        print(f"❌ Ошибка получения пользователей: {users_response.status_code}")
        return
    
    users = users_response.json()
    if not users:
        print("❌ Нет пользователей в системе")
        return
    
    user = users[0]
    print(f"👤 Пользователь: {user['username']}")
    print(f"   Роль: {user['role']}")
    print(f"   Специализация: {user['specialization']}")
    print(f"   Интересы: {', '.join(user.get('interests', []))}")
    
    response = requests.post(
        f"{API_BASE}/api/search/",
        json={
            "query": "алгоритмы",
            "user_id": user['user_id'],
            "top_k": 5,
            "enable_personalization": True
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        return
    
    data = response.json()
    print(f"\n🔍 Запрос: '{data['query']}'")
    print(f"Персонализация: ✅ Включена")
    print(f"\nТоп-5 результатов:")
    
    table = []
    for r in data['results'][:5]:
        table.append([
            r['position'],
            r['title'][:40] + '...',
            r['document_type'],
            r['subject'],
            f"{r['base_score']:.1f}",
            f"{r['ctr_boost']:.2f}",
            f"{r['final_score']:.1f}"
        ])
    
    print(tabulate(table, headers=['#', 'Название', 'Тип', 'Предмет', 'Base', 'CTR', 'Final'], tablefmt='grid'))

def test_filters():
    print("\n" + "=" * 80)
    print("  3. ПОИСК С ФИЛЬТРАМИ")
    print("=" * 80)
    
    response = requests.post(
        f"{API_BASE}/api/search/",
        json={
            "query": "математика",
            "top_k": 5,
            "enable_personalization": False,
            "filters": {
                "document_type": "textbook",
                "year_from": 2020
            }
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        return
    
    data = response.json()
    print(f"🔍 Запрос: '{data['query']}'")
    print(f"📚 Фильтры: Тип=textbook, Год>=2020")
    print(f"Найдено: {data['total']} документов")
    
    table = []
    for r in data['results'][:5]:
        table.append([
            r['position'],
            r['title'][:50] + '...',
            r['year'],
            f"{r['final_score']:.2f}"
        ])
    
    print(tabulate(table, headers=['#', 'Название', 'Год', 'Скор'], tablefmt='grid'))

def test_available_filters():
    print("\n" + "=" * 80)
    print("  4. ДОСТУПНЫЕ ФИЛЬТРЫ")
    print("=" * 80)
    
    response = requests.get(f"{API_BASE}/api/search/filters")
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        return
    
    data = response.json()
    
    print("📚 Типы документов:")
    for doc_type in data['document_types']:
        print(f"   • {doc_type}")
    
    print(f"\n📖 Предметов: {len(data['subjects'])}")
    print("   Примеры:", ', '.join(data['subjects'][:5]))
    
    year_range = data['year_range']
    print(f"\n📅 Диапазон годов: {year_range['min']} - {year_range['max']}")

def test_user_stats():
    print("\n" + "=" * 80)
    print("  5. СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ")
    print("=" * 80)
    
    users_response = requests.get(f"{API_BASE}/api/users/?limit=1")
    if users_response.status_code != 200:
        print(f"❌ Ошибка: {users_response.status_code}")
        return
    
    users = users_response.json()
    if not users:
        print("❌ Нет пользователей")
        return
    
    user_id = users[0]['user_id']
    
    response = requests.get(f"{API_BASE}/api/users/{user_id}/stats")
    
    if response.status_code != 200:
        print(f"❌ Ошибка: {response.status_code}")
        return
    
    data = response.json()
    print(f"👤 Пользователь: {data['username']}")
    print(f"🖱️  Всего кликов: {data['total_clicks']}")
    print(f"🎓 Роль: {data['role']}")
    print(f"📚 Специализация: {data['specialization']}")

def main():
    print("🔬" * 40)
    print("  ТЕСТИРОВАНИЕ БИБЛИОТЕЧНОЙ ПОИСКОВОЙ СИСТЕМЫ")
    print("🔬" * 40)
    
    check_api()
    
    try:
        test_basic_search()
        test_personalized_search()
        test_filters()
        test_available_filters()
        test_user_stats()
        
        print("\n" + "=" * 80)
        print("✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!")
        print("=" * 80)
        print(f"\n🌐 Swagger UI: {API_BASE}/docs")
        print(f"📊 OpenSearch Dashboards: http://localhost:5601")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Тестирование прервано")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
