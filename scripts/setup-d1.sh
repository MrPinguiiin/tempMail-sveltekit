#!/bin/bash

echo "🚀 Setting up D1 Database for tempMail..."

# 1. Create D1 database
echo "📦 Creating D1 database..."
wrangler d1 create tempmail-db

echo ""
echo "📋 Next steps:"
echo "1. Copy database_id from above and update wrangler.toml"
echo "2. Run: wrangler d1 execute tempmail-db --file=schema.sql"
echo "3. Run: wrangler deploy"
echo ""
echo "✅ Setup completed!"
