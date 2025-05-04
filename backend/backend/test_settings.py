# backend/test_settings.py
from .settings import *  # Import your main settings

# Override Celery settings for testing
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use memory broker for tests
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache'
CELERY_CACHE_BACKEND = 'memory'

# Disable Celery beat for tests
CELERY_BEAT_SCHEDULER = None