.PHONY: help up down build logs demo clean

help:
	@echo "Available commands:"
	@echo "  make up      - Start all services (api, web, workers, postgres)"
	@echo "  make down    - Stop all services"
	@echo "  make build   - Build all docker images"
	@echo "  make logs    - View logs of all services"
	@echo "  make demo    - Start all services and populate with realistic demo data"
	@echo "  make clean   - Stop services and remove volumes (wipes database)"

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

clean:
	docker-compose down -v

demo:
	docker-compose up -d
	@echo "Waiting for API to be ready..."
	@sleep 10
	docker-compose exec -T api python scripts/seed_demo.py
	@echo "Demo data populated! Visit http://localhost:3000 to explore AsyncHub."
