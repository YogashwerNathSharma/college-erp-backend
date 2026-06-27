#!/bin/bash
######################################################
# 🚀 DEPLOYMENT SCRIPT
######################################################

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying College ERP ($ENVIRONMENT)..."

# Build all packages
echo "📦 Building shared package..."
cd shared && npm run build && cd ..

echo "🏗️ Building backend..."
cd backend && npm run build && cd ..

echo "🎨 Building frontend..."
cd frontend && npm run build && cd ..

echo "🎓 Building student portal..."
cd student-portal && npm run build && cd ..

echo ""
echo "✅ Build complete!"
echo ""

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  echo "📤 Deploying to production..."
  # Add production deployment commands here
  # e.g., pm2 restart, docker push, etc.
elif [ "$ENVIRONMENT" = "staging" ]; then
  echo "📤 Deploying to staging..."
  # Add staging deployment commands here
fi

echo "✅ Deployment complete!"
