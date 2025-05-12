import pytest
from celery import current_app

@pytest.fixture(autouse=True)
def celery_config():
    return {
        'task_always_eager': True,
        'task_eager_propagates': True,
        'broker_url': 'memory://',
        'result_backend': None,
    }

@pytest.fixture(autouse=True)
def setup_celery(celery_config):
    current_app.conf.update(celery_config)