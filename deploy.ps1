# Production Deployment Script for Windows PowerShell
# Run from repository root: .\deploy.ps1

Write-Host "🚀 Starting production deployment..." -ForegroundColor Cyan

# Check if docker-compose.prod.yml exists
if (-not (Test-Path "docker-compose.prod.yml")) {
    Write-Host "❌ docker-compose.prod.yml not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building production images..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml build

Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml down

Write-Host "🔄 Starting production containers..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml up -d

Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔍 Container status:" -ForegroundColor Cyan
docker compose -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "🌐 Application available at: http://deneb.ddns.net" -ForegroundColor Green
Write-Host "📋 View logs: docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
