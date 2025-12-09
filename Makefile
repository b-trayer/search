.PHONY: help setup up down restart logs check clean install dev test

help:
	@echo "Доступные команды:"
	@echo "  make up          - Запустить Docker контейнеры"
	@echo "  make down        - Остановить контейнеры"
	@echo "  make dev         - Запустить FastAPI сервер"
	@echo "  make check       - Проверить инфраструктуру"
	@echo "  make logs        - Показать логи"
	@echo "  make psql        - Подключиться к PostgreSQL"

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

dev:
	uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

check:
	python scripts/check_infrastructure.py

psql:
	psql -h localhost -p 5432 -U library_user -d library_search

install:
	python3 -m venv venv
	. venv/bin/activate && pip install --upgrade pip
	. venv/bin/activate && pip install -r requirements.txt

clean:
	docker-compose down -v

status:
	docker-compose ps
