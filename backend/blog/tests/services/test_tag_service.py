"""
Тесты для сервиса TagService.

Этот модуль содержит тесты для проверки работы методов класса TagService,
отвечающего за бизнес-логику, связанную с моделью Tag.
"""

import pytest
from django.utils import timezone
from blog.models import Post, Tag
from blog.services.tag_service import TagService

# Используем factory для создания тестовых данных
from ..test_posts import TagFactory, PostFactory


@pytest.mark.django_db
class TestTagService:
    """Тестирование методов сервиса TagService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем несколько тегов
        self.tag1 = TagFactory(name="Тег 1", slug="tag-1")
        self.tag2 = TagFactory(name="Тег 2", slug="tag-2")
        self.tag3 = TagFactory(name="Тег 3", slug="tag-3")
        
        # Создаем посты и связываем их с тегами
        # Опубликованный пост с тегом 1
        self.post1 = PostFactory(
            title="Пост 1",
            slug="post-1",
            is_published=True,
            first_published_at=timezone.now()
        )
        self.post1.tags.add(self.tag1)
        
        # Опубликованный пост с тегами 1 и 2
        self.post2 = PostFactory(
            title="Пост 2",
            slug="post-2",
            is_published=True,
            first_published_at=timezone.now() - timezone.timedelta(days=1)
        )
        self.post2.tags.add(self.tag1, self.tag2)
        
        # Черновик с тегом 2
        self.draft_post = PostFactory(
            title="Черновик",
            slug="draft-post",
            is_published=False
        )
        self.draft_post.tags.add(self.tag2)
        
        # Тег 3 не имеет постов

    def test_get_all_tags(self):
        """Тест получения списка всех тегов."""
        tags = TagService.get_all_tags()
        
        # Проверяем, что все теги возвращаются
        assert len(tags) == 3
        assert self.tag1 in tags
        assert self.tag2 in tags
        assert self.tag3 in tags
        
        # Проверяем сортировку по имени
        assert list(tags) == sorted(list(tags), key=lambda x: x.name)

    def test_get_tags_with_post_count(self):
        """Тест получения тегов с количеством опубликованных постов."""
        tags = TagService.get_tags_with_post_count()
        
        # Проверяем корректность аннотации posts_count
        tag1 = next(t for t in tags if t.id == self.tag1.id)
        tag2 = next(t for t in tags if t.id == self.tag2.id)
        tag3 = next(t for t in tags if t.id == self.tag3.id)
        
        assert tag1.posts_count == 2  # Тег 1 связан с двумя опубликованными постами
        assert tag2.posts_count == 1  # Тег 2 связан с одним опубликованным постом и одним черновиком
        assert tag3.posts_count == 0  # Тег 3 не имеет постов

    def test_get_tag_by_slug(self):
        """Тест получения тега по slug."""
        # Получение существующего тега
        tag = TagService.get_tag_by_slug("tag-1")
        assert tag == self.tag1
        
        # Попытка получить несуществующий тег
        non_existent = TagService.get_tag_by_slug("non-existent-slug")
        assert non_existent is None

    def test_get_posts_by_tag(self):
        """Тест получения опубликованных постов для тега."""
        # Получение постов для тега 1
        posts_tag1 = TagService.get_posts_by_tag(self.tag1)
        assert len(posts_tag1) == 2
        assert self.post1 in posts_tag1
        assert self.post2 in posts_tag1
        
        # Получение постов для тега 2 (только опубликованные)
        posts_tag2 = TagService.get_posts_by_tag(self.tag2)
        assert len(posts_tag2) == 1
        assert self.post2 in posts_tag2
        assert self.draft_post not in posts_tag2
        
        # Получение постов для тега 3 (нет постов)
        posts_tag3 = TagService.get_posts_by_tag(self.tag3)
        assert len(posts_tag3) == 0

    def test_create_tag_success(self):
        """Тест успешного создания нового тега."""
        # Создание нового тега
        tag, result = TagService.create_tag("Новый тег")
        
        assert tag is not None
        assert tag.name == "Новый тег"
        assert tag.slug == "novyy-teg"  # slug генерируется автоматически
        assert result["status"] == 201
        
        # Проверяем, что тег был создан в БД
        assert Tag.objects.filter(name="Новый тег").exists()

    def test_create_tag_existing_name(self):
        """Тест создания тега с существующим именем."""
        # Попытка создать тег с именем, которое уже существует
        tag, result = TagService.create_tag("Тег 1")
        
        assert tag == self.tag1
        assert result["status"] == 200
        assert "detail" in result
        assert result["detail"] == "Тег уже существует"

    def test_create_tag_slug_collision(self):
        """Тест создания тега с разным именем, но одинаковым slug."""
        # Попытка создать тег с другим именем, но с slug, который будет совпадать
        tag, result = TagService.create_tag("Тег-1")  # Slug будет "teg-1", что сложно для проверки
        
        # Для надежного тестирования нужно создать новые теги с похожими именами
        test_tag = TagFactory(name="Test", slug="test")
        
        # Попытка создать тег, который будет иметь тот же slug
        tag, result = TagService.create_tag("TEST")  # Должен быть slug "test"
        
        assert tag == test_tag
        assert result["status"] == 409
        assert "error" in result
        assert "Slug collision" in result["error"]

    def test_create_tag_empty_name(self):
        """Тест создания тега с пустым именем."""
        tag, result = TagService.create_tag("")
        
        assert tag is None
        assert result["status"] == 400
        assert "error" in result
        assert "name" in result["error"]

    def test_get_popular_tags(self):
        """Тест получения популярных тегов."""
        popular_tags = TagService.get_popular_tags(limit=2)
        
        # Проверяем, что возвращаются самые популярные теги
        assert len(popular_tags) == 2
        assert popular_tags[0] == self.tag1  # Тег 1 связан с 2 постами
        assert popular_tags[1] == self.tag2  # Тег 2 связан с 1 опубликованным постом
        
        # Тег 3 не должен быть в популярных, так как не имеет опубликованных постов
        assert self.tag3 not in popular_tags
        
        # Проверка ограничения количества
        all_popular = TagService.get_popular_tags(limit=10)
        assert len(all_popular) == 2  # Всего 2 тега с опубликованными постами
