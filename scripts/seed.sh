#!/bin/bash
######################################################
# 🌱 DATABASE SEED SCRIPT
######################################################

set -e

echo "🚀 Starting database seed..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found! Copy .env.example to .env first."
  exit 1
fi

# Source environment
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Generating Prisma client..."
cd backend
npx prisma generate

echo "🌱 Running seed..."
npx ts-node prisma/seed.ts

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "Default credentials:"
echo "  Super Admin: admin@college-erp.com / Admin@123"
echo "  Tenant Admin: school@demo.com / School@123"
echo ""
