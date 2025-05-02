from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


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
    image = models.ImageField(upload_to="posts/", null=True, blank=True)
    tags = models.ManyToManyField("Tag", related_name="posts")
    first_published_at = models.DateTimeField()
    is_published = models.BooleanField(default=True)

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
    code = models.CharField(max_length=12, unique=True)

    def get_redirect_url(self):
        return self.post.get_absolute_url()


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

    short_url = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Короткая ссылка",
    )
