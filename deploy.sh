#!/bin/bash
# Production Deployment Script
# Run from repository root: ./deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Check if docker-compose.prod.yml exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml not found!"
    exit 1
fi

echo "📦 Building production images..."
docker compose -f docker-compose.prod.yml build

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

echo "🔄 Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Deployment complete!"
echo "🔍 Container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Application available at: http://deneb.ddns.net"
echo "📋 View logs: docker compose -f docker-compose.prod.yml logs -f"
