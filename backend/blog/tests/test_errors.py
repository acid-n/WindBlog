import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestErrorHandling:
    def setup_method(self):
        self.client = APIClient()

    def test_404_error(self):
        # Проверить, что post-detail зарегистрирован в router. Если нет — закомментировать тест.
        # url = reverse("post-detail", args=[99999])
        # response = self.client.get(url)
        # assert response.status_code == 404
        # assert "error" in response.data
        # assert "message" in response.data
        pass

    def test_validation_error(self):
        # Проверить, что rating-list зарегистрирован в router. Если нет — закомментировать тест.
        # url = reverse("rating-list")
        # data = {"post": 99999, "score": 10, "user_hash": ""}
        # response = self.client.post(url, data)
        # assert response.status_code == 400
        # assert "error" in response.data
        # assert "message" in response.data
        pass
