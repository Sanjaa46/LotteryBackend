#!/bin/sh

set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Running bootstrap..."
node dist/bootstrap/bootstrap.js

echo "Starting server..."
node dist/server.js