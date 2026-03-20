#!/usr/bin/env bash

set -e

# Run database migrations for backend from Docker Compose
cd "$(dirname "$0")/.."

# Ensure Docker Compose services are running
docker compose -f docker-compose.yml up -d

# Wait for backend to be ready
echo "Waiting for backend service to be available..."
sleep 10

# Run Prisma migrate deploy in backend container
docker compose -f docker-compose.yml exec backend npm run db:deploy

# Optional seed
# docker compose -f docker-compose.yml exec backend npm run db:seed

echo "Migrations completed."
