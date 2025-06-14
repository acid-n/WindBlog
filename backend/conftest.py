import pytest
from django.conf import settings


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
        "ATOMIC_REQUESTS": False,
    }
