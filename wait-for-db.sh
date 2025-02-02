#!/bin/sh
# wait-for-db.sh

set -e

until npx prisma db push --skip-generate; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
exec "$@" 