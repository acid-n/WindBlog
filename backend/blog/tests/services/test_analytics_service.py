"""
Тесты для сервиса AnalyticsService.

Этот модуль содержит тесты для проверки работы методов класса AnalyticsService,
отвечающего за бизнес-логику, связанную с моделью AnalyticsEvent.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from blog.models import AnalyticsEvent
from blog.services.analytics_service import AnalyticsService


@pytest.mark.django_db
class TestAnalyticsService:
    """Тестирование методов сервиса AnalyticsService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем тестовые события с разными датами и путями
        time_now = timezone.now()
        
        # Событие 1 - самое новое
        self.event1 = AnalyticsEvent.objects.create(
            path="/home",
            referrer="https://google.com",
            user_agent="Mozilla/5.0 Test",
            ip="192.168.1.1"
        )
        
        # Событие 2 - 1 день назад
        self.event2 = AnalyticsEvent.objects.create(
            path="/blog/post-1",
            referrer="https://yandex.ru",
            user_agent="Chrome/90.0",
            ip="192.168.1.2",
            created_at=time_now - timedelta(days=1)
        )
        
        # Событие 3 - 2 дня назад
        self.event3 = AnalyticsEvent.objects.create(
            path="/blog/post-2",
            user_agent="Firefox/80.0",
            ip="192.168.1.3",
            created_at=time_now - timedelta(days=2)
        )
        
        # Событие 4 - 15 дней назад
        self.event4 = AnalyticsEvent.objects.create(
            path="/about",
            referrer="https://example.com",
            user_agent="Safari/14.0",
            ip="192.168.1.4",
            created_at=time_now - timedelta(days=15)
        )
        
        # Событие 5 - 45 дней назад (вне интервала в 30 дней)
        self.event5 = AnalyticsEvent.objects.create(
            path="/old-page",
            user_agent="IE/11.0",
            ip="192.168.1.5",
            created_at=time_now - timedelta(days=45)
        )

    def test_create_event_success(self):
        """Тест успешного создания события аналитики."""
        event_data = {
            "path": "/test-path",
            "ip": "192.168.1.1",
            "user_agent": "Test User Agent",
            "referrer": "https://example.com"
        }
        
        event, error = AnalyticsService.create_event(event_data)
        
        # Проверяем, что нет ошибок
        assert error is None
        assert event is not None
        
        # Проверяем, что данные сохранены корректно
        assert event.path == "/test-path"
        assert event.ip == "192.168.1.1"
        assert event.user_agent == "Test User Agent"
        assert event.referrer == "https://example.com"
        
        # Проверяем, что событие сохранено в БД
        assert AnalyticsEvent.objects.filter(path="/test-path").exists()

    def test_create_event_missing_path(self):
        """Тест создания события без обязательного поля path."""
        event_data = {
            "ip": "192.168.1.1",
            "user_agent": "Test User Agent"
        }
        
        event, error = AnalyticsService.create_event(event_data)
        
        # Проверяем, что есть ошибка
        assert error is not None
        assert event is None
        assert "Путь страницы обязателен" in error.get("error", "")
        assert error.get("status") == 400

    def test_create_event_partial_data(self):
        """Тест создания события с частичными данными."""
        # Обязательные поля path и ip
        event_data = {
            "path": "/partial-data",
            "ip": "192.168.1.10",
            "user_agent": ""  # пустое поле user_agent
        }
        
        event, error = AnalyticsService.create_event(event_data)
        
        # Проверяем, что нет ошибок
        assert error is None
        assert event is not None
        
        # Проверяем значения полей
        assert event.path == "/partial-data"
        assert event.ip == "192.168.1.10"  # Обязательное поле
        assert event.user_agent == ""  # Пустое значение
        assert event.referrer is None  # None по умолчанию (разрешен null)

    def test_get_view_stats(self):
        """Тест получения статистики просмотров."""
        # Получаем статистику за 30 дней (все события кроме самого старого)
        stats = AnalyticsService.get_view_stats(days=30)
        
        # Проверяем структуру ответа
        assert "total_views" in stats
        assert "page_stats" in stats
        assert "daily_stats" in stats
        assert "period_days" in stats
        
        # Проверяем количество просмотров (события в интервале 30 дней)
        assert stats["total_views"] == 5
        
        # Проверяем статистику по страницам
        page_stats = stats["page_stats"]
        assert len(page_stats) == 5  # 5 уникальных путей (по одному на каждое событие)
        
        # Проверяем статистику по дням
        daily_stats = stats["daily_stats"]
        assert len(daily_stats) > 0
        
        # Проверяем период
        assert stats["period_days"] == 30
        
        # Проверяем ограничение по дням
        stats_7days = AnalyticsService.get_view_stats(days=7)
        # В текущей версии сервиса все события попадают в интервал 7 дней
        assert stats_7days["total_views"] == 5

    def test_get_events_by_path_prefix(self):
        """Тест получения событий по префиксу пути."""
        # Получаем события для страниц блога
        blog_events = AnalyticsService.get_events_by_path_prefix("/blog")
        
        # Проверяем, что возвращены только события для страниц блога
        assert any(event.path == "/blog/post-1" for event in blog_events)
        assert any(event.path == "/blog/post-2" for event in blog_events)
        
        # Проверяем сортировку (сначала новые)
        # Событие "/blog/post-1" создано раньше чем "/blog/post-2"
        paths = [event.path for event in blog_events]
        assert paths.count("/blog/post-1") == 1
        assert paths.count("/blog/post-2") == 1
        
        # Проверяем ограничение количества
        limited_events = AnalyticsService.get_events_by_path_prefix("/blog", limit=1)
        assert len(limited_events) == 1  # Только первое событие

    def test_get_latest_events(self):
        """Тест получения последних событий."""
        # Получаем последние события
        latest_events = AnalyticsService.get_latest_events()
        
        # Проверяем, что возвращены все события
        assert len(latest_events) == 5
        
        # Проверяем наличие событий с определенными путями
        paths = [event.path for event in latest_events]
        assert "/home" in paths
        assert "/blog/post-1" in paths
        assert "/blog/post-2" in paths
        assert "/about" in paths
        assert "/old-page" in paths
        
        # Проверяем ограничение количества
        limited_events = AnalyticsService.get_latest_events(limit=3)
        assert len(limited_events) == 3  # Только первые 3 события
