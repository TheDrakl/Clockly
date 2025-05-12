#!/bin/sh

# Maximumr number of connection attempts
MAX_ATTEMPTS=30
attempt=0

echo "Waiting for PostgreSQL..."

# Wait for PostgreSQL to be ready
while ! nc -z db 5432; do
  attempt=$((attempt+1))
  if [ $attempt -ge $MAX_ATTEMPTS ]; then
    echo "Failed to connect to PostgreSQL after $MAX_ATTEMPTS attempts!"
    exit 1
  fi
  
  echo "Attempt $attempt/$MAX_ATTEMPTS: PostgreSQL not ready yet..."
  sleep 2
done

echo "PostgreSQL started"

# Only run migrations and superuser creation if this is the web service
if [ "$1" = "gunicorn" ]; then
  sleep 5
  echo "Running migrations..."
  python manage.py migrate --noinput

  echo "Collecting static files..."
  python manage.py collectstatic --noinput

  echo "Creating superuser..."
  echo "from django.contrib.auth import get_user_model; \
  User = get_user_model(); \
  User.objects.filter(email='denismelnyk@icloud.com').exists() or \
  User.objects.create_superuser('denismelnyk@icloud.com', 'denys', '123')" | python manage.py shell

else
  # Wait until migrations are complete
  echo "Waiting for migrations to complete..."
  while true; do
    if python manage.py migrate --check >/dev/null 2>&1; then
      break
    fi
    echo "Migrations not complete yet, waiting..."
    sleep 2
  done
  echo "Migrations verified as complete"
fi

exec "$@"