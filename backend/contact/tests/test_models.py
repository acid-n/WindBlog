import pytest
from blog.models import ContactMessage


@pytest.mark.django_db
def test_message_creation():
    msg = ContactMessage.objects.create(name="u", email="u@test.com", message="hi")
    assert msg.pk is not None
