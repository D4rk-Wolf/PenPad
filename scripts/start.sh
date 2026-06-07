#!/bin/sh
set -e
# Apply forward-only, version-tracked migrations from the self-hosted lineage
# (drizzle/). Unlike `push --force`, `migrate` never issues destructive DDL on its
# own — it only runs the reviewed SQL in drizzle/*.sql that has not yet been applied,
# recorded in the __drizzle_migrations table. Safe to run on every container start:
# already-applied migrations are skipped. Operators review any schema change as a
# committed migration file before it ships in an image.
echo "Applying database migrations (drizzle-kit migrate)..."
./node_modules/.bin/drizzle-kit migrate --config=drizzle.config.selfhosted.ts
echo "Starting server..."
exec node server.js
