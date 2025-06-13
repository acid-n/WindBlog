"""
Тесты для модели ShortLink.

Проверяют корректность работы модели коротких ссылок, включая генерацию кода и получение URL перенаправления.
"""

import pytest
import re
from django.utils import timezone

from blog.models import Post, ShortLink


@pytest.mark.django_db
class TestShortLinkModel:
    """Тесты для модели коротких ссылок."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        # Создаем пост для тестов коротких ссылок
        self.post = Post.objects.create(
            title="Тестовый пост для коротких ссылок",
            slug="test-post-shortlinks",
            description="Описание поста для тестов коротких ссылок",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )

    def test_shortlink_auto_creation(self):
        """Тест автоматического создания короткой ссылки при создании поста."""
        # ShortLink должен создаваться автоматически через сигнал post_save
        shortlinks = ShortLink.objects.filter(post=self.post)
        
        assert shortlinks.exists()
        assert shortlinks.count() == 1
        
    def test_shortlink_code_generation(self):
        """Тест генерации уникального кода для короткой ссылки."""
        shortlink = ShortLink.objects.get(post=self.post)
        
        # Проверяем, что код был сгенерирован
        assert shortlink.code is not None
        assert len(shortlink.code) == 8
        
        # Проверяем формат кода (буквы и цифры)
        assert re.match(r'^[a-zA-Z0-9]+$', shortlink.code) is not None
        
    def test_get_redirect_url(self):
        """Тест получения URL для перенаправления."""
        shortlink = ShortLink.objects.get(post=self.post)
        
        # URL перенаправления должен совпадать с абсолютным URL поста
        assert shortlink.get_redirect_url() == self.post.get_absolute_url()
        
    def test_str_representation(self):
        """Тест строкового представления короткой ссылки."""
        shortlink = ShortLink.objects.get(post=self.post)
        
        # Проверяем, что строковое представление содержит код и часть заголовка поста
        assert shortlink.code in str(shortlink)
        assert self.post.title[:30] in str(shortlink)
        
    def test_manual_shortlink_creation(self):
        """Тест ручного создания короткой ссылки."""
        # Создаем ещё один пост
        post2 = Post.objects.create(
            title="Второй тестовый пост",
            slug="second-test-post",
            description="Описание второго поста",
            body={"type": "doc", "content": []},
            is_published=True,
            first_published_at=timezone.now(),
        )
        
        # У этого поста уже есть автоматически созданная короткая ссылка
        # Создаем еще одну вручную
        shortlink = ShortLink.objects.create(post=post2)
        
        # Проверяем, что у поста теперь две короткие ссылки
        assert ShortLink.objects.filter(post=post2).count() == 2
        
        # Проверяем, что для новой ссылки сгенерирован уникальный код
        assert shortlink.code is not None
        assert len(shortlink.code) == 8
