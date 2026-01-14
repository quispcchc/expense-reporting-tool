#!/bin/bash
# start-dev.sh - Unix/Mac/Linux dev server launcher
# Auto-detects package manager based on lock file

cd "$(dirname "$0")"

detect_package_manager() {
    if [ -f "pnpm-lock.yaml" ]; then
        echo "pnpm"
    elif [ -f "yarn.lock" ]; then
        echo "yarn"
    elif [ -f "package-lock.json" ]; then
        echo "npm"
    else
        echo "npm"  # Default to npm if no lock file found
    fi
}

PM=$(detect_package_manager)
echo "[PM2] Starting dev server with $PM..."

if [ "$PM" = "pnpm" ]; then
    pnpm dev
elif [ "$PM" = "yarn" ]; then
    yarn dev
else
    npm run dev
fi
