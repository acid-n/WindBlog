"""
Тесты для сервиса PostService.

Этот модуль содержит тесты для проверки работы методов класса PostService,
отвечающего за бизнес-логику, связанную с моделью Post.
"""

import pytest
from django.utils import timezone
from django.conf import settings
from blog.models import Post, Tag
from blog.services.post_service import PostService

# Используем factory для создания тестовых данных
from ..test_posts import TagFactory, PostFactory


@pytest.mark.django_db
class TestPostService:
    """Тестирование методов сервиса PostService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем теги
        self.tag1 = TagFactory(name="Тег 1", slug="tag-1")
        self.tag2 = TagFactory(name="Тег 2", slug="tag-2")

        # Создаем опубликованный пост
        self.published_post = PostFactory(
            title="Опубликованный пост",
            slug="published-post",
            is_published=True,
            first_published_at=timezone.now(),
            sitemap_include=True,
            body_text_for_search="текст для поиска в опубликованном посте"
        )
        self.published_post.tags.add(self.tag1)

        # Создаем черновик
        self.draft_post = PostFactory(
            title="Черновик",
            slug="draft-post",
            is_published=False,
            sitemap_include=False,
            body_text_for_search="текст для поиска в черновике"
        )
        self.draft_post.tags.add(self.tag2)

        # Создаем пост с несколькими тегами
        self.tagged_post = PostFactory(
            title="Пост с тегами",
            slug="tagged-post",
            is_published=True,
            first_published_at=timezone.now() - timezone.timedelta(days=1),
            sitemap_include=True
        )
        self.tagged_post.tags.add(self.tag1, self.tag2)

    def test_get_published_posts(self):
        """Тест получения списка опубликованных постов."""
        posts = PostService.get_published_posts()
        
        # Проверяем, что возвращаются только опубликованные посты
        assert len(posts) == 2
        assert self.published_post in posts
        assert self.tagged_post in posts
        assert self.draft_post not in posts
        
        # Проверяем сортировку (сначала новые)
        post_list = list(posts)
        assert post_list[0] == self.published_post  # Более новый пост должен быть первым
        assert post_list[1] == self.tagged_post

    def test_get_draft_posts(self):
        """Тест получения списка черновиков."""
        drafts = PostService.get_draft_posts()
        
        # Проверяем, что возвращаются только черновики
        assert len(drafts) == 1
        assert self.draft_post in drafts
        assert self.published_post not in drafts
        assert self.tagged_post not in drafts

    def test_get_posts_for_sitemap(self):
        """Тест получения постов для sitemap."""
        sitemap_posts = PostService.get_posts_for_sitemap()
        
        # Проверяем, что возвращаются только опубликованные посты с sitemap_include=True
        assert len(sitemap_posts) == 2
        assert self.published_post in sitemap_posts
        assert self.tagged_post in sitemap_posts
        assert self.draft_post not in sitemap_posts

    def test_search_posts(self):
        """Тест полнотекстового поиска по постам."""
        # Ищем по части заголовка
        results_title = PostService.search_posts("опубликованный")
        assert len(results_title) == 1
        assert self.published_post in results_title
        
        # Ищем по тексту внутри поста
        results_body = PostService.search_posts("текст для поиска")
        assert len(results_body) >= 1
        assert self.published_post in results_body
        assert self.draft_post not in results_body  # Черновики не ищутся
        
        # Пустой поисковый запрос
        empty_results = PostService.search_posts("")
        assert len(empty_results) == 0

    def test_get_post_by_slug(self):
        """Тест получения поста по slug."""
        # Получение существующего поста
        post = PostService.get_post_by_slug("published-post")
        assert post == self.published_post
        
        # Получение черновика по slug
        draft = PostService.get_post_by_slug("draft-post")
        assert draft == self.draft_post
        
        # Попытка получить несуществующий пост
        non_existent = PostService.get_post_by_slug("non-existent-slug")
        assert non_existent is None

    def test_get_post_by_id(self):
        """Тест получения опубликованного поста по ID."""
        # Получение существующего опубликованного поста
        post = PostService.get_post_by_id(self.published_post.id)
        assert post == self.published_post
        
        # Попытка получить черновик
        draft = PostService.get_post_by_id(self.draft_post.id)
        assert draft is None  # Метод возвращает только опубликованные посты
        
        # Попытка получить пост по несуществующему ID
        non_existent = PostService.get_post_by_id(999999)
        assert non_existent is None
        
        # Попытка получить пост по некорректному ID
        invalid_id = PostService.get_post_by_id("not-an-id")
        assert invalid_id is None
