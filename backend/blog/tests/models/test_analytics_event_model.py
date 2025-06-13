"""
Тесты для модели AnalyticsEvent.

Проверяют корректность работы модели событий аналитики.
"""

import pytest
from django.utils import timezone

from blog.models import AnalyticsEvent


@pytest.mark.django_db
class TestAnalyticsEventModel:
    """Тесты для модели событий аналитики."""

    def test_create_analytics_event(self):
        """Тест создания события аналитики с основными полями."""
        event = AnalyticsEvent.objects.create(
            path="/blog/test-post/",
            ip="127.0.0.1",
            user_agent="Mozilla/5.0 (Test Browser)",
            referrer="https://google.com/"
        )
        
        assert event.id is not None
        assert event.path == "/blog/test-post/"
        assert event.ip == "127.0.0.1"
        assert event.user_agent == "Mozilla/5.0 (Test Browser)"
        assert event.referrer == "https://google.com/"
        
        # Проверка автоматически заполняемых полей
        assert event.created_at is not None
        assert event.updated_at is not None
        
    def test_create_event_without_referrer(self):
        """Тест создания события без реферера."""
        event = AnalyticsEvent.objects.create(
            path="/blog/test-post/",
            ip="127.0.0.1",
            user_agent="Mozilla/5.0 (Test Browser)"
        )
        
        assert event.id is not None
        assert event.referrer is None
        
    def test_analytics_event_timestamp(self):
        """Тест временных меток создания и обновления."""
        # Запоминаем текущее время до создания события
        before_create = timezone.now()
        
        event = AnalyticsEvent.objects.create(
            path="/blog/test-post/",
            ip="127.0.0.1",
            user_agent="Mozilla/5.0 (Test Browser)"
        )
        
        # Проверяем, что временная метка создания установлена корректно
        assert event.created_at >= before_create
        assert event.updated_at >= before_create
        
        # Запоминаем время перед обновлением
        before_update = timezone.now()
        
        # Обновляем событие
        event.path = "/blog/updated-path/"
        event.save()
        
        # Перезагружаем объект из БД
        event.refresh_from_db()
        
        # Проверяем, что временная метка обновления изменилась, а создания - нет
        assert event.updated_at >= before_update
        assert event.created_at < before_update  # метка создания не должна меняться
        
    def test_multiple_events_for_same_path(self):
        """Тест создания нескольких событий для одного пути."""
        # Создаем несколько событий для одного пути
        path = "/blog/popular-post/"
        
        AnalyticsEvent.objects.create(
            path=path,
            ip="127.0.0.1",
            user_agent="Mozilla/5.0 (Chrome)"
        )
        
        AnalyticsEvent.objects.create(
            path=path,
            ip="192.168.1.1",
            user_agent="Mozilla/5.0 (Firefox)"
        )
        
        # Проверяем, что оба события были созданы
        events = AnalyticsEvent.objects.filter(path=path)
        assert events.count() == 2
        
        # Проверяем, что у них разные IP и user_agent
        assert events[0].ip != events[1].ip
        assert events[0].user_agent != events[1].user_agent
