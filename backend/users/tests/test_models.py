import pytest
from users.models import CustomUser

@pytest.mark.django_db
def test_user_creation():
    user = CustomUser.objects.create_user(email='u@test.com', password='pass')
    assert user.check_password('pass')
