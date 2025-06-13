"""
Тесты для модели Tag.

Проверяют корректность работы модели тегов, включая автоматическую генерацию slug.
"""

import pytest
from django.db.utils import IntegrityError

from blog.models import Tag


@pytest.mark.django_db
class TestTagModel:
    """Тесты для модели тегов."""

    def test_create_tag(self):
        """Тест создания тега с автоматической генерацией slug."""
        tag = Tag.objects.create(name="Тестовый тег")
        
        assert tag.id is not None
        assert tag.name == "Тестовый тег"
        assert tag.slug == "testovyi-teg"  # Фактический формат slug после транслитерации
        assert str(tag) == "Тестовый тег"

    def test_create_tag_with_slug(self):
        """Тест создания тега с заданным slug."""
        tag = Tag.objects.create(name="Тестовый тег", slug="custom-slug")
        
        assert tag.slug == "custom-slug"
        
    def test_create_tag_with_duplicate_name(self):
        """Тест проверки уникальности имени тега."""
        Tag.objects.create(name="Дубликат")
        
        with pytest.raises(IntegrityError):
            Tag.objects.create(name="Дубликат")
            
    def test_create_tag_with_duplicate_slug(self):
        """Тест проверки уникальности slug тега."""
        Tag.objects.create(name="Первый", slug="duplicate-slug")
        
        with pytest.raises(IntegrityError):
            Tag.objects.create(name="Второй", slug="duplicate-slug")
            
    def test_auto_increment_duplicate_slug(self):
        """Тест автоматического добавления инкремента к дублирующимся slug."""
        Tag.objects.create(name="Тест")  # slug будет "test"
        tag2 = Tag.objects.create(name="Test")  # slug должен быть "test-1"
        
        assert tag2.slug == "test-1"
        
        tag3 = Tag.objects.create(name="TEST")  # slug должен быть "test-2"
        assert tag3.slug == "test-2"
