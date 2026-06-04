#!/bin/sh
set -e
echo "Syncing database schema (drizzle-kit push)..."
# `push` provisions a fresh Postgres directly from the Drizzle schema. This is the
# correct path for self-hosted: the repo's migration files are a hybrid (hand-written
# Supabase SQL + a Drizzle-generated auth migration) whose journal does not describe a
# full fresh-DB baseline, so `drizzle-kit migrate` cannot build the schema from empty.
# `push` is idempotent — on restart it is a no-op when the schema already matches.
./node_modules/.bin/drizzle-kit push --force
echo "Starting server..."
exec node server.js
