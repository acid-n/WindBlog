import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from seo.models import GlobalSEOSettings, RobotsRule

# Create your tests here.


@pytest.mark.django_db
class TestRobotsTxtView:

    @pytest.fixture(autouse=True)
    def setup_settings(self, settings):
        # Устанавливаем тестовый FRONTEND_URL для предсказуемости Sitemap URL
        settings.FRONTEND_URL = "http://testfrontend.com"

    def test_robots_txt_empty(self):
        """Тест генерации robots.txt без правил и настроек."""
        client = APIClient()
        url = reverse("robots_txt")
        response = client.get(url)

        assert response.status_code == 200
        assert response.headers["Content-Type"] == "text/plain"
        expected_content = (
            "User-agent: *\n"
            "Disallow: /admin/\n\n"
            "Sitemap: http://testfrontend.com/sitemap.xml"
        )
        assert response.content.decode("utf-8").strip() == expected_content.strip()

    def test_robots_txt_with_rules_and_settings(self):
        """Тест генерации robots.txt с правилами и настройками."""
        client = APIClient()
        # Создаем настройки
        GlobalSEOSettings.objects.create(
            robots_crawl_delay=10,
            # другие настройки можно не указывать
        )
        # Создаем правила
        RobotsRule.objects.create(user_agent="Googlebot", directive="Allow", path="/")
        RobotsRule.objects.create(
            user_agent="Googlebot", directive="Disallow", path="/private/"
        )
        RobotsRule.objects.create(
            user_agent="YandexBot", directive="Disallow", path="/"
        )
        RobotsRule.objects.create(
            user_agent="*", directive="Disallow", path="/cgi-bin/"
        )

        url = reverse("robots_txt")
        response = client.get(url)

        assert response.status_code == 200
        assert response.headers["Content-Type"] == "text/plain"
        # Ожидаем определенный порядок: сначала *, потом Googlebot, потом YandexBot
        # Проверяем наличие всех строк
        content = response.content.decode("utf-8")

        assert "User-agent: *" in content
        assert "Disallow: /cgi-bin/" in content
        assert "Crawl-delay: 10" in content  # Должен быть для *?

        assert "User-agent: Googlebot" in content
        assert "Allow: /" in content
        assert "Disallow: /private/" in content
        assert "Crawl-delay: 10" in content  # Должен быть для Googlebot?

        assert "User-agent: YandexBot" in content
        assert "Disallow: /" in content
        assert "Crawl-delay: 10" in content  # Должен быть для YandexBot?

        assert "Sitemap: http://testfrontend.com/sitemap.xml" in content

        # Уточнение: По стандарту Crawl-delay применяется к блоку User-agent.
        # Наша view добавляет его ко всем блокам, если он задан.
        # Если нужно применять только к определенным, логику view надо усложнить.
