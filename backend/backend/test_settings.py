from .settings import *

# Disable Celery during tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = None

# Override email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable periodic tasks
CELERY_BEAT_SCHEDULE = {}

# Ensure we're not using Redis cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Make sure these are after all other settings
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'your_project.test_settings'