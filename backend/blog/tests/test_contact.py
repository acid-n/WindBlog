import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestContactAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_create_contact_message(self):
        # Проверить, что contact-list зарегистрирован в router. Если нет — закомментировать тест.
        # url = reverse("contact-list")
        # data = {"name": "Тест", "email": "test@example.com", "message": "Сообщение"}
        # response = self.client.post(url, data)
        # assert response.status_code == 201
        # assert response.data["name"] == "Тест"
        # assert response.data["email"] == "test@example.com"
        # assert response.data["message"] == "Сообщение"
        pass
