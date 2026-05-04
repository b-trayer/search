#!/bin/bash
set -e

cd ~/search

echo "=== Loading documents to OpenSearch ==="
python3 scripts/load_books_to_opensearch.py

echo "=== Loading users to PostgreSQL ==="
python3 scripts/load_users_to_db.py

echo "=== Removing foreign key constraints ==="
docker exec library-postgres psql -U library_user -d library_search -c "ALTER TABLE impressions DROP CONSTRAINT IF EXISTS impressions_document_id_fkey;"
docker exec library-postgres psql -U library_user -d library_search -c "ALTER TABLE clicks DROP CONSTRAINT IF EXISTS clicks_document_id_fkey;"

echo "=== Generating clicks ==="
python3 scripts/generate_clicks.py

echo "=== Done! ==="
