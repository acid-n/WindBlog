import pytest
from blog.models import ContactMessage
from blog.serializers import ContactMessageSerializer


@pytest.mark.django_db
def test_serializer():
    msg = ContactMessage.objects.create(name="u", email="u@test.com", message="hi")
    data = ContactMessageSerializer(msg).data
    assert data["email"] == "u@test.com"
