"""
Тесты для модели Post.

Проверяют корректность работы модели постов, включая валидацию полей,
генерацию slug, автоматическое создание ShortLink.
"""

import json
import pytest
from django.db.utils import IntegrityError
from django.utils import timezone

from blog.models import Post, ShortLink, Tag


@pytest.mark.django_db
class TestPostModel:
    """Тесты для модели постов блога."""

    def setup_method(self):
        """Подготовка тестовых данных."""
        self.tag1 = Tag.objects.create(name="Тег 1")
        self.tag2 = Tag.objects.create(name="Тег 2")
        
        # Базовые данные для создания поста
        self.post_data = {
            "title": "Тестовый пост",
            "slug": "testovyj-post",
            "description": "Описание тестового поста",
            "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Текст поста"}]}]},
            "is_published": True,
            "first_published_at": timezone.now(),
        }

    def test_create_post(self):
        """Тест создания поста с основными полями."""
        post = Post.objects.create(**self.post_data)
        
        assert post.id is not None
        assert post.title == "Тестовый пост"
        assert post.slug == "testovyj-post"
        assert post.is_published is True
        
        # Проверка автоматического создания ShortLink
        assert ShortLink.objects.filter(post=post).exists()
        
    def test_post_with_tags(self):
        """Тест создания поста с тегами."""
        post = Post.objects.create(**self.post_data)
        post.tags.add(self.tag1, self.tag2)
        
        assert post.tags.count() == 2
        assert list(post.tags.values_list('name', flat=True)) == ["Тег 1", "Тег 2"]
        
    def test_post_duplicate_slug(self):
        """Тест проверки уникальности slug поста."""
        Post.objects.create(**self.post_data)
        
        duplicate_data = self.post_data.copy()
        duplicate_data["title"] = "Другой заголовок"
        
        with pytest.raises(IntegrityError):
            Post.objects.create(**duplicate_data)
            
    def test_extract_text_from_tiptap_json(self):
        """Тест извлечения текста из Tiptap JSON."""
        post = Post.objects.create(**self.post_data)
        
        # Создаем тестовый JSON с различными блоками текста
        test_json = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Первый параграф."}]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "Заголовок"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Второй параграф."}]
                }
            ]
        }
        
        # Преобразуем в строку, как обычно хранится в БД
        json_str = json.dumps(test_json)
        
        # Проверяем извлечение текста
        text = post.extract_text_from_tiptap_json(json_str)
        assert "Первый параграф." in text
        assert "Заголовок" in text
        assert "Второй параграф." in text
        
    def test_get_absolute_url(self):
        """Тест получения абсолютного URL поста."""
        post = Post.objects.create(**self.post_data)
        
        assert post.get_absolute_url() == f"/posts/{post.slug}/"
