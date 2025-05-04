from .settings import *

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache'
CELERY_CACHE_BACKEND = 'memory'

# Disable periodic tasks during tests
CELERY_BEAT_SCHEDULE = {}

# Email backend for tests
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

print("✅ Using test_settings.py")