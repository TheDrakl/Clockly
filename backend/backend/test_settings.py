from .settings import *

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = None  # Not needed when running eagerly

CELERY_BEAT_SCHEDULER = None

print("✅ Using test_settings.py")