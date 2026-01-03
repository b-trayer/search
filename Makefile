.PHONY: help up down restart logs clean dev status psql build

help:
	@echo "Available commands:"
	@echo "  make up      - Start all services"
	@echo "  make down    - Stop all services"
	@echo "  make build   - Build Docker images"
	@echo "  make logs    - Show logs"
	@echo "  make status  - Show container status"
	@echo "  make dev     - Start backend in dev mode (without Docker)"
	@echo "  make psql    - Connect to PostgreSQL"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

status:
	docker-compose ps

dev:
	uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

psql:
	docker exec -it library-postgres psql -U library_user -d library_search

clean:
	docker-compose down -v
	docker rmi library-backend library-frontend 2>/dev/null || true
