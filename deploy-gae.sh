#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting manual deployment to Google App Engine..."

# 1. Build Frontend
echo "📦 Building Frontend..."
cd frontend
pnpm install
pnpm build
cd ..

# 2. Prepare Backend (Optional if running locally)
# echo "📦 Preparing Backend..."
# cd backend
# composer install --no-dev --optimize-autoloader
# cd ..

# 3. Deploy Services
echo "🌍 Deploying Frontend (default service)..."
gcloud app deploy frontend/app.yaml --quiet

echo "⚙️ Deploying Backend (api service)..."
gcloud app deploy backend/app.yaml --quiet

# 4. Deploy Dispatch Rules
echo "🛣️ Deploying Dispatch Rules..."
gcloud app deploy dispatch.yaml --quiet

echo "✅ Deployment complete!"
echo "Check your services at: https://CONSOLE_LINK_TO_GAE"
