from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify
from django.db.models.signals import pre_save
from django.dispatch import receiver
from seo.models import SITEMAP_CHANGEFREQ_CHOICES
import secrets
import string


class AbstractBaseModel(models.Model):
    """Абстрактная базовая модель с created_at и updated_at."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tag(AbstractBaseModel):
    """Модель тега для классификации постов."""

    name = models.CharField(max_length=64, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Post(AbstractBaseModel):
    """Модель поста блога."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, editable=True)
    description = models.TextField(blank=True)
    body = models.JSONField()  # StreamField-like JSON
    body_text_for_search = models.TextField(editable=False, blank=True, null=True)
    image = models.ImageField(upload_to="posts/", null=True, blank=True)
    tags = models.ManyToManyField("Tag", related_name="posts")
    first_published_at = models.DateTimeField()
    is_published = models.BooleanField(default=True)

    # Поля для управления Sitemap
    sitemap_include = models.BooleanField(
        default=True,
        verbose_name="Включить в sitemap.xml",
        help_text="Включить этот пост в автоматически генерируемый sitemap.xml?"
    )
    sitemap_priority = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        verbose_name="Приоритет в sitemap (0.0-1.0)",
        help_text="Укажите приоритет от 0.0 до 1.0. Оставьте пустым для использования значения по умолчанию."
    )
    sitemap_changefreq = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=SITEMAP_CHANGEFREQ_CHOICES,
        verbose_name="Частота обновления в sitemap",
        help_text="Укажите частоту обновления. Оставьте пустым для использования значения по умолчанию."
    )

    class Meta:
        ordering = ["-first_published_at"]
        indexes = [models.Index(fields=["slug"])]

    def get_absolute_url(self):
        return f"/posts/{self.slug}/"


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


class ShortLink(models.Model):
    """Короткая ссылка на пост."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="shortlinks")
    code = models.CharField(
        max_length=8, 
        unique=True,
        blank=True,
        editable=False
    )

    def __str__(self):
        return f"Shortlink {self.code} for {self.post.title[:30]}..."

    def get_redirect_url(self):
        return self.post.get_absolute_url()

    def _generate_unique_code(self):
        """Генерирует уникальный случайный код."""
        length = 8 
        alphabet = string.ascii_letters + string.digits
        while True:
            code = ''.join(secrets.choice(alphabet) for i in range(length))
            if not ShortLink.objects.filter(code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._generate_unique_code()
        super().save(*args, **kwargs)


class AnalyticsEvent(AbstractBaseModel):
    """Событие аналитики: посещение, ip, user_agent, referrer."""

    path = models.CharField(max_length=255)
    ip = models.GenericIPAddressField()
    user_agent = models.TextField()
    referrer = models.URLField(blank=True, null=True)


class ContactMessage(AbstractBaseModel):
    """Сообщение из формы обратной связи."""

    name = models.CharField(max_length=100)
    email = models.EmailField()
    message = models.TextField()


# Функция для извлечения текста из JSON (упрощенная)
def extract_text_from_body_json(json_data):
    texts = []
    if isinstance(json_data, list):
        for block in json_data:
            if isinstance(block, dict):
                # Проверяем популярные ключи для текстового контента
                if block.get('type') == 'paragraph' and isinstance(block.get('data'), dict) and 'text' in block['data']:
                    texts.append(str(block['data']['text']))
                elif block.get('type') == 'header' and isinstance(block.get('data'), dict) and 'text' in block['data']:
                    texts.append(str(block['data']['text']))
                elif block.get('type') == 'list' and isinstance(block.get('data'), dict) and 'items' in block['data']:
                    if isinstance(block['data']['items'], list):
                        for item in block['data']['items']:
                            texts.append(str(item))
                # Добавьте другие типы блоков и ключи, если необходимо
                # Можно также сделать более общий обход словаря для поиска строковых значений
                elif 'text' in block: # Общий случай для блоков с ключом 'text'
                     texts.append(str(block['text']))
                elif 'content' in block: # Общий случай для блоков с ключом 'content'
                     texts.append(str(block['content']))
    elif isinstance(json_data, dict): # Если body - это один блок, а не список
        if 'text' in json_data:
            texts.append(str(json_data['text']))
    return " ".join(filter(None, texts)) # Убираем пустые строки

@receiver(pre_save, sender=Post)
def update_post_search_text(sender, instance, **kwargs):
    if instance.body: # Проверяем, что body не пустое
        instance.body_text_for_search = extract_text_from_body_json(instance.body)
    else:
        instance.body_text_for_search = ""
