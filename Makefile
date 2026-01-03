.PHONY: help up down restart logs clean install dev status psql

help:
	@echo "Available commands:"
	@echo "  make up          - Start Docker containers"
	@echo "  make down        - Stop containers"
	@echo "  make dev         - Start FastAPI server"
	@echo "  make logs        - Show logs"
	@echo "  make psql        - Connect to PostgreSQL"
	@echo "  make status      - Show container status"

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
