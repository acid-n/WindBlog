import pytest
from seo.models import GlobalSEOSettings, RobotsRule


@pytest.mark.django_db
def test_robots_rule_creation():
    rule = RobotsRule.objects.create(
        user_agent="*", directive="Disallow", path="/admin/"
    )
    assert str(rule) == "Disallow: /admin/ (*)"


@pytest.mark.django_db
def test_global_settings_creation():
    settings = GlobalSEOSettings.objects.create(robots_crawl_delay=5)
    assert settings.robots_crawl_delay == 5
