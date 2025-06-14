import pytest
from blog.models import AnalyticsEvent

@pytest.mark.django_db
def test_event_creation():
    event = AnalyticsEvent.objects.create(path='/test', ip='127.0.0.1', user_agent='UA')
    assert event.pk is not None
