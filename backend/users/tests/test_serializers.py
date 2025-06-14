import pytest
from users.models import CustomUser
from users.serializers import MyTokenObtainPairSerializer

@pytest.mark.django_db
def test_token_serializer():
    user = CustomUser.objects.create_user(email='u@test.com', password='pass')
    token = MyTokenObtainPairSerializer.get_token(user)
    assert token['email'] == 'u@test.com'
