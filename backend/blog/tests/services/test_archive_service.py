"""
Тесты для сервиса ArchiveService.

Этот модуль содержит тесты для проверки работы методов класса ArchiveService,
отвечающего за бизнес-логику, связанную с архивированием постов по датам.
"""

import datetime
import pytest
from django.utils import timezone
from blog.models import Post
from blog.services.archive_service import ArchiveService

# Используем factory для создания тестовых данных
from ..test_posts import TagFactory, PostFactory


@pytest.mark.django_db
class TestArchiveService:
    """Тестирование методов сервиса ArchiveService."""

    def setup_method(self):
        """Настройка данных для каждого теста."""
        # Создаем посты с разными датами для тестирования архива
        
        # 2022 год
        # Январь 2022
        self.post_2022_01_01 = PostFactory(
            title="Пост 2022-01-01",
            slug="post-2022-01-01",
            is_published=True,
            first_published_at=datetime.datetime(2022, 1, 1, tzinfo=timezone.utc)
        )
        
        self.post_2022_01_15 = PostFactory(
            title="Пост 2022-01-15",
            slug="post-2022-01-15",
            is_published=True,
            first_published_at=datetime.datetime(2022, 1, 15, tzinfo=timezone.utc)
        )
        
        # Февраль 2022
        self.post_2022_02_10 = PostFactory(
            title="Пост 2022-02-10",
            slug="post-2022-02-10",
            is_published=True,
            first_published_at=datetime.datetime(2022, 2, 10, tzinfo=timezone.utc)
        )
        
        # 2023 год
        # Март 2023
        self.post_2023_03_05 = PostFactory(
            title="Пост 2023-03-05",
            slug="post-2023-03-05",
            is_published=True,
            first_published_at=datetime.datetime(2023, 3, 5, tzinfo=timezone.utc)
        )
        
        # Черновик, не должен учитываться в архиве
        self.draft_post = PostFactory(
            title="Черновик",
            slug="draft-post",
            is_published=False,
            first_published_at=datetime.datetime(2023, 3, 10, tzinfo=timezone.utc)
        )

    def test_get_years_summary(self):
        """Тест получения сводки постов по годам."""
        years_summary = ArchiveService.get_years_summary()
        
        # Проверяем, что есть записи для 2022 и 2023 годов
        assert len(years_summary) == 2
        
        # Проверяем, что годы отсортированы по убыванию (сначала новые)
        assert years_summary[0]["year"] == 2023
        assert years_summary[1]["year"] == 2022
        
        # Проверяем количество постов для каждого года
        assert years_summary[0]["posts_count"] == 1  # 2023 год - 1 опубликованный пост
        assert years_summary[1]["posts_count"] == 3  # 2022 год - 3 опубликованных поста

    def test_get_months_summary(self):
        """Тест получения сводки постов по месяцам для указанного года."""
        # Тестируем для 2022 года
        months_summary_2022 = ArchiveService.get_months_summary(2022)
        
        # Проверяем, что есть записи для января и февраля
        assert len(months_summary_2022) == 2
        
        # Проверяем правильность месяцев
        assert months_summary_2022[0]["month"] == 1  # Январь
        assert months_summary_2022[1]["month"] == 2  # Февраль
        
        # Проверяем количество постов для каждого месяца
        assert months_summary_2022[0]["posts_count"] == 2  # Январь - 2 поста
        assert months_summary_2022[1]["posts_count"] == 1  # Февраль - 1 пост
        
        # Тестируем для 2023 года
        months_summary_2023 = ArchiveService.get_months_summary(2023)
        
        # Проверяем, что есть запись только для марта
        assert len(months_summary_2023) == 1
        assert months_summary_2023[0]["month"] == 3  # Март
        assert months_summary_2023[0]["posts_count"] == 1  # 1 опубликованный пост
        
        # Тестируем для года, в котором нет постов
        months_summary_2024 = ArchiveService.get_months_summary(2024)
        assert len(months_summary_2024) == 0

    def test_get_days_summary(self):
        """Тест получения сводки постов по дням для указанного года и месяца."""
        # Тестируем для января 2022
        days_summary_2022_01 = ArchiveService.get_days_summary(2022, 1)
        
        # Проверяем, что есть записи для 1 и 15 января
        assert len(days_summary_2022_01) == 2
        
        # Проверяем правильность дней
        assert days_summary_2022_01[0]["day"] == 1  # 1 января
        assert days_summary_2022_01[1]["day"] == 15  # 15 января
        
        # Проверяем количество постов для каждого дня
        assert days_summary_2022_01[0]["posts_count"] == 1  # 1 января - 1 пост
        assert days_summary_2022_01[1]["posts_count"] == 1  # 15 января - 1 пост
        
        # Тестируем для месяца/года, в котором нет постов
        days_summary_empty = ArchiveService.get_days_summary(2024, 1)
        assert len(days_summary_empty) == 0

    def test_get_posts_by_date_year(self):
        """Тест получения постов за указанный год."""
        # Посты за 2022 год
        posts_2022 = ArchiveService.get_posts_by_date(2022)
        
        # Проверяем, что возвращены все посты за 2022 год
        assert len(posts_2022) == 3
        assert self.post_2022_01_01 in posts_2022
        assert self.post_2022_01_15 in posts_2022
        assert self.post_2022_02_10 in posts_2022
        
        # Проверяем сортировку (от новых к старым)
        posts_list = list(posts_2022)
        assert posts_list[0] == self.post_2022_02_10  # 10 февраля
        assert posts_list[1] == self.post_2022_01_15  # 15 января
        assert posts_list[2] == self.post_2022_01_01  # 1 января

    def test_get_posts_by_date_year_month(self):
        """Тест получения постов за указанный год и месяц."""
        # Посты за январь 2022
        posts_2022_01 = ArchiveService.get_posts_by_date(2022, 1)
        
        # Проверяем, что возвращены все посты за январь 2022
        assert len(posts_2022_01) == 2
        assert self.post_2022_01_01 in posts_2022_01
        assert self.post_2022_01_15 in posts_2022_01
        assert self.post_2022_02_10 not in posts_2022_01
        
        # Посты за февраль 2022
        posts_2022_02 = ArchiveService.get_posts_by_date(2022, 2)
        assert len(posts_2022_02) == 1
        assert self.post_2022_02_10 in posts_2022_02

    def test_get_posts_by_date_year_month_day(self):
        """Тест получения постов за указанный год, месяц и день."""
        # Посты за 1 января 2022
        posts_2022_01_01 = ArchiveService.get_posts_by_date(2022, 1, 1)
        
        # Проверяем, что возвращен только пост за 1 января 2022
        assert len(posts_2022_01_01) == 1
        assert self.post_2022_01_01 in posts_2022_01_01
        
        # Посты за 15 января 2022
        posts_2022_01_15 = ArchiveService.get_posts_by_date(2022, 1, 15)
        assert len(posts_2022_01_15) == 1
        assert self.post_2022_01_15 in posts_2022_01_15
        
        # Проверка на дату, для которой нет постов
        posts_empty = ArchiveService.get_posts_by_date(2022, 1, 2)
        assert len(posts_empty) == 0

    def test_get_posts_by_date_invalid_date(self):
        """Тест получения постов с некорректной датой."""
        # Тестируем некорректный месяц
        invalid_month = ArchiveService.get_posts_by_date(2022, 13)
        assert len(invalid_month) == 0
        
        # Тестируем некорректный день (31 февраля)
        invalid_day = ArchiveService.get_posts_by_date(2022, 2, 31)
        assert len(invalid_day) == 0
