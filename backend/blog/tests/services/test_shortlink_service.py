"""
Тесты для сервиса ShortLinkService.

Этот модуль содержит тесты для проверки работы методов класса ShortLinkService,
отвечающего за бизнес-логику, связанную с моделью ShortLink.
"""

import pytest
from django.utils import timezone
from blog.models import Post, ShortLink
from blog.services.shortlink_service import ShortLinkService

# Используем factory для создания тестовых данных
from ..test_posts import PostFactory


@pytest.mark.django_db
class TestShortLinkService:
    """Тестирование методов сервиса ShortLinkService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем посты для тестирования коротких ссылок
        self.post1 = PostFactory(
            title="Пост 1",
            slug="post-1",
            is_published=True,
            first_published_at=timezone.now()
        )
        
        self.post2 = PostFactory(
            title="Пост 2",
            slug="post-2",
            is_published=True,
            first_published_at=timezone.now()
        )
        
        # Создаем короткую ссылку для первого поста
        self.shortlink1 = ShortLink.objects.create(post=self.post1)
        
        # Для второго поста не создаем ссылку, чтобы проверить генерацию

    def test_get_all_shortlinks(self):
        """Тест получения всех коротких ссылок."""
        shortlinks = ShortLinkService.get_all_shortlinks()
        
        # Проверяем, что есть хотя бы одна ссылка
        assert len(shortlinks) >= 1
        
        # Проверяем, что наша ссылка входит в результаты
        assert self.shortlink1 in shortlinks
        
        # Проверяем связь с постом
        first_link = shortlinks.first()
        assert hasattr(first_link, 'post')
        assert first_link.post is not None

    def test_get_shortlink_by_code(self):
        """Тест получения короткой ссылки по коду."""
        # Получаем существующую ссылку
        shortlink = ShortLinkService.get_shortlink_by_code(self.shortlink1.code)
        assert shortlink == self.shortlink1
        assert shortlink.post == self.post1
        
        # Проверяем поиск по несуществующему коду
        non_existent = ShortLinkService.get_shortlink_by_code("non-existent-code")
        assert non_existent is None

    def test_get_redirect_url(self):
        """Тест получения URL для редиректа."""
        # Получаем URL для существующей ссылки
        redirect_url = ShortLinkService.get_redirect_url(self.shortlink1)
        
        # URL должен соответствовать URL поста
        assert redirect_url == self.post1.get_absolute_url()
        
        # Проверяем обработку None-ссылки
        default_redirect = ShortLinkService.get_redirect_url(None)
        assert default_redirect == "/"

    def test_generate_shortlink_for_post(self):
        """Тест генерации короткой ссылки для поста."""
        # Генерируем новую ссылку для второго поста
        shortlink = ShortLinkService.generate_shortlink_for_post(self.post2)
        
        # Проверяем, что ссылка создана
        assert shortlink is not None
        assert shortlink.post == self.post2
        assert shortlink.code is not None
        
        # Проверяем, что ссылка сохранена в базе
        assert ShortLink.objects.filter(post=self.post2).exists()
        
        # Проверяем, что повторная генерация вернет существующую ссылку
        same_shortlink = ShortLinkService.generate_shortlink_for_post(self.post2)
        assert same_shortlink == shortlink
        
        # Проверяем генерацию для уже имеющего ссылку поста
        existing_shortlink = ShortLinkService.generate_shortlink_for_post(self.post1)
        assert existing_shortlink == self.shortlink1
        
        # Проверяем обработку None-поста
        none_shortlink = ShortLinkService.generate_shortlink_for_post(None)
        assert none_shortlink is None
