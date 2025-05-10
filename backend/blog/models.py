import json
import logging
import os
import secrets
import string

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

logger = logging.getLogger(__name__)


# Возвращаем определение AbstractBaseModel сюда
class AbstractBaseModel(models.Model):
    """Абстрактная базовая модель с created_at и updated_at."""

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        abstract = True


# Validator for WEBP images
def validate_webp(value):
    ext = os.path.splitext(value.name)[1]  # [0] returns path+filename
    valid_extensions = [".webp"]
    if not ext.lower() in valid_extensions:
        raise ValidationError(
            "Неподдерживаемый формат файла. Разрешены только WEBP изображения."
        )

    # Проверка MIME типа, если файл уже загружен (например, при сохранении)
    # На практике, ImageField сам проверяет, является ли файл изображением через Pillow.
    # Дополнительная проверка MIME-типа здесь может быть избыточной или сложной без чтения всего файла.
    # Pillow при открытии файла с неправильным MIME для ImageField уже вызовет ошибку.
    # Однако, если файл не прошел через Pillow (например, прямой FileObject), это может быть полезно.
    # Для простоты пока оставим только проверку расширения, полагаясь на Pillow для остального.
    # Если потребуется более строгая проверка MIME на этом этапе, можно добавить:
    # if hasattr(value, 'file') and hasattr(value.file, 'content_type'):
    #     if value.file.content_type != 'image/webp':
    #         raise ValidationError('Неверный MIME тип. Разрешены только WEBP изображения (image/webp).')


class Tag(AbstractBaseModel):
    """Модель тега для классификации постов."""

    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = "Тег"
        verbose_name_plural = "Теги"

    def __str__(self):
        return self.name


def get_default_tiptap_json_string():
    """Возвращает пустую структуру Tiptap JSON по умолчанию в виде СТРОКИ."""
    return json.dumps({"type": "doc", "content": []})


class Post(AbstractBaseModel):
    """Модель поста блога."""

    title = models.CharField(max_length=255, verbose_name="Заголовок")
    slug = models.SlugField(
        max_length=255, unique=True, editable=True, verbose_name="URL (слаг)"
    )
    description = models.TextField(
        blank=True, verbose_name="Описание (для SEO и анонса)"
    )

    body = models.JSONField(
        verbose_name="Основной контент (JSON)",
        null=True,
        blank=True,
        default=get_default_tiptap_json_string,
    )

    body_text_for_search = models.TextField(editable=False, null=True, blank=True)

    image = models.ImageField(
        upload_to="posts/uploads/",
        null=True,
        blank=True,
        verbose_name="Изображение для анонса",
        validators=[validate_webp],
        max_length=255,
    )
    tags = models.ManyToManyField("Tag", related_name="posts", verbose_name="Теги")
    first_published_at = models.DateTimeField(
        verbose_name="Дата первой публикации", null=True, blank=True
    )
    is_published = models.BooleanField("Опубликовано", default=False)

    # Поля для управления Sitemap
    sitemap_include = models.BooleanField(
        default=True,
        verbose_name="Включить в sitemap.xml",
        help_text="Включить этот пост в автоматически генерируемый sitemap.xml?",
    )
    sitemap_priority = models.DecimalField(
        "Priority для sitemap",
        max_digits=2,
        decimal_places=1,
        default=0.5,
        help_text="От 0.0 до 1.0",
    )
    sitemap_changefreq = models.CharField(
        "Changefreq для sitemap",
        max_length=10,
        choices=[
            ("always", "Always"),
            ("hourly", "Hourly"),
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
            ("yearly", "Yearly"),
            ("never", "Never"),
        ],
        default="weekly",
    )

    class Meta:
        ordering = ["-first_published_at"]
        indexes = [models.Index(fields=["slug"])]
        verbose_name = "Пост"
        verbose_name_plural = "Посты"

    def get_absolute_url(self):
        return f"/posts/{self.slug}/"

    def extract_text_from_tiptap_json(self, json_data_or_str):
        json_data = None
        if isinstance(json_data_or_str, str) and json_data_or_str.strip():
            try:
                json_data = json.loads(json_data_or_str)
            except json.JSONDecodeError:
                logger.warning(
                    f"Failed to parse JSON string for Post ID {self.id}: {json_data_or_str[:100]}"
                )
                return ""
        elif isinstance(json_data_or_str, dict):
            json_data = json_data_or_str

        text_content = []
        if (
            not json_data
            or not isinstance(json_data, dict)
            or "content" not in json_data
        ):
            return ""

        for node in json_data.get("content", []):
            if node.get("type") == "text" and "text" in node:
                text_content.append(node["text"])
            elif "content" in node:
                text_content.append(self.extract_text_from_tiptap_json(node))

        return " ".join(filter(None, text_content)).strip()

    def save(self, *args, **kwargs):
        self.body_text_for_search = self.extract_text_from_tiptap_json(self.body)

        if self.is_published and self.first_published_at is None:
            self.first_published_at = timezone.now()

        super().save(*args, **kwargs)


class Rating(models.Model):
    """Оценка поста (1-5), уникальна для user_hash и поста."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="ratings")
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    user_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user_hash")
        verbose_name = "Рейтинг"
        verbose_name_plural = "Рейтинги"


class ShortLink(models.Model):
    """Короткая ссылка на пост."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="shortlinks")
    code = models.CharField(max_length=8, unique=True, blank=True, editable=False)

    def __str__(self):
        return f"Shortlink {self.code} for {self.post.title[:30]}..."

    def get_redirect_url(self):
        return self.post.get_absolute_url()

    def _generate_unique_code(self):
        """Генерирует уникальный случайный код."""
        length = 8
        alphabet = string.ascii_letters + string.digits
        while True:
            code = "".join(secrets.choice(alphabet) for i in range(length))
            if not ShortLink.objects.filter(code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_unique_code()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Короткая ссылка"
        verbose_name_plural = "Короткие ссылки"


class AnalyticsEvent(AbstractBaseModel):
    """Событие аналитики: посещение, ip, user_agent, referrer."""

    path = models.CharField(max_length=255)
    ip = models.GenericIPAddressField()
    user_agent = models.TextField()
    referrer = models.URLField(blank=True, null=True)

    class Meta:
        verbose_name = "Событие аналитики"
        verbose_name_plural = "События аналитики"


class ContactMessage(AbstractBaseModel):
    """Сообщение из формы обратной связи."""

    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()

    class Meta:
        verbose_name = "Сообщение (контакты)"
        verbose_name_plural = "Сообщения (контакты)"


@receiver(post_save, sender=Post)
def create_shortlink_for_post(sender, instance, created, **kwargs):
    """Создает ShortLink для нового поста, если он еще не существует."""
    if created:
        # Проверяем, есть ли уже ShortLink (на случай если ForeignKey останется и их может быть несколько)
        # Для OneToOneField проверка будет проще: if not hasattr(instance, 'shortlink') or not instance.shortlink:
        if not ShortLink.objects.filter(post=instance).exists():
            ShortLink.objects.create(post=instance)
            # logger.info(f"Создана короткая ссылка для поста {instance.id}") # Опционально для логирования
