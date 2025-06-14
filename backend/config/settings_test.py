from .settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
        'CONN_MAX_AGE': 0,
        'OPTIONS': {},
    }
}
