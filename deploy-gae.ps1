# Manual Deployment Script for Google App Engine (Windows PowerShell)

Write-Host "🚀 Starting manual deployment to Google App Engine..." -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "📦 Building Frontend..." -ForegroundColor Yellow
Set-Location frontend
pnpm install
pnpm build
Set-Location ..

# 2. Deploy Services
Write-Host "🌍 Deploying Frontend (default service)..." -ForegroundColor Yellow
gcloud app deploy frontend/app.yaml --quiet

Write-Host "⚙️ Deploying Backend (api service)..." -ForegroundColor Yellow
gcloud app deploy backend/app.yaml --quiet

# 3. Deploy Dispatch Rules
Write-Host "🛣️ Deploying Dispatch Rules..." -ForegroundColor Yellow
gcloud app deploy dispatch.yaml --quiet

Write-Host "✅ Deployment complete!" -ForegroundColor Green
