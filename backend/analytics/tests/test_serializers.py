import pytest
from blog.models import AnalyticsEvent
from blog.serializers import AnalyticsEventSerializer

@pytest.mark.django_db
def test_serializer_data():
    event = AnalyticsEvent.objects.create(path='/t', ip='127.0.0.1', user_agent='UA')
    data = AnalyticsEventSerializer(event).data
    assert data['path'] == '/t'
