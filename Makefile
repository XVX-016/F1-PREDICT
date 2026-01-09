# F1 Predict Docker Makefile

.PHONY: help build build-dev build-prod up up-dev up-prod down down-dev down-prod clean logs logs-dev logs-prod shell shell-backend shell-frontend shell-ml test test-dev test-prod

# Default target
help:
	@echo "F1 Predict Docker Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make build-dev    - Build development images"
	@echo "  make up-dev       - Start development environment"
	@echo "  make down-dev     - Stop development environment"
	@echo "  make logs-dev     - View development logs"
	@echo ""
	@echo "Production:"
	@echo "  make build-prod   - Build production images"
	@echo "  make up-prod      - Start production environment"
	@echo "  make down-prod    - Stop production environment"
	@echo "  make logs-prod    - View production logs"
	@echo ""
	@echo "General:"
	@echo "  make build        - Build all images"
	@echo "  make up           - Start default environment"
	@echo "  make down         - Stop default environment"
	@echo "  make clean        - Remove all containers, images, and volumes"
	@echo "  make shell-backend - Access backend container shell"
	@echo "  make shell-frontend - Access frontend container shell"
	@echo "  make shell-ml     - Access ML service container shell"

# Build targets
build:
	docker-compose build

build-dev:
	docker-compose -f docker-compose.dev.yml build

build-prod:
	docker-compose -f docker-compose.prod.yml build

# Start targets
up:
	docker-compose up -d

up-dev:
	docker-compose -f docker-compose.dev.yml up -d

up-prod:
	docker-compose -f docker-compose.prod.yml up -d

# Stop targets
down:
	docker-compose down

down-dev:
	docker-compose -f docker-compose.dev.yml down

down-prod:
	docker-compose -f docker-compose.prod.yml down

# Logs targets
logs:
	docker-compose logs -f

logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

# Shell access targets
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-ml:
	docker-compose exec ml-service bash

# Clean target
clean:
	docker-compose down -v --rmi all
	docker system prune -f
	docker volume prune -f

# Test targets
test:
	docker-compose exec backend npm test

test-dev:
	docker-compose -f docker-compose.dev.yml exec backend-dev npm test

test-prod:
	docker-compose -f docker-compose.prod.yml exec backend npm test

# Database targets
db-reset:
	docker-compose exec postgres psql -U postgres -d f1_prediction_market -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	docker-compose exec postgres psql -U postgres -d f1_prediction_market -f /docker-entrypoint-initdb.d/schema.sql

db-seed:
	docker-compose exec backend npm run seed:f1

# Monitoring targets
status:
	docker-compose ps

status-dev:
	docker-compose -f docker-compose.dev.yml ps

status-prod:
	docker-compose -f docker-compose.prod.yml ps

# Backup targets
backup-db:
	docker-compose exec postgres pg_dump -U postgres f1_prediction_market > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore-db:
	docker-compose exec -T postgres psql -U postgres -d f1_prediction_market < $(file)
