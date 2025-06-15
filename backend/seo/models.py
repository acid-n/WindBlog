from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

# Create your models here.


class RobotsRule(models.Model):
    """Правило для файла robots.txt."""

    user_agent = models.CharField(
        max_length=255,
        default="*",
        help_text="Для какого User-agent (например, '*', 'Googlebot').",
    )
    directive = models.CharField(
        max_length=10, choices=[("Allow", "Allow"), ("Disallow", "Disallow")]
    )
    path = models.CharField(
        max_length=255, help_text="Путь, например, '/admin/' или '/private_page'."
    )

    def __str__(self):
        return f"{self.directive}: {self.path} ({self.user_agent})"

    class Meta:
        verbose_name = "Правило robots.txt"
        verbose_name_plural = "Правила robots.txt"
        ordering = ["user_agent", "directive", "path"]  # Базовая сортировка


# Используем django-solo для Singleton модели (нужно установить: pip install django-solo)
# Если django-solo не используется, просто используйте models.Model и убедитесь,
# что в админке создается только одна запись.
# from solo.models import SingletonModel

SITEMAP_CHANGEFREQ_CHOICES = [
    ("always", "Always"),
    ("hourly", "Hourly"),
    ("daily", "Daily"),
    ("weekly", "Weekly"),
    ("monthly", "Monthly"),
    ("yearly", "Yearly"),
    ("never", "Never"),
]


class GlobalSEOSettings(
    models.Model
):  # Замените на SingletonModel, если используется django-solo
    """Глобальные SEO настройки сайта."""

    site_verification_google = models.CharField(
        max_length=100,
        blank=True,
        help_text="Код верификации Google Search Console (содержимое meta-тега name='google-site-verification').",
    )
    site_verification_yandex = models.CharField(
        max_length=100,
        blank=True,
        help_text="Код верификации Yandex Webmaster (содержимое meta-тега name='yandex-verification').",
    )
    robots_crawl_delay = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Crawl-delay для robots.txt (в секундах, используйте с осторожностью!).",
    )
    default_sitemap_priority = models.FloatField(
        default=0.5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Приоритет по умолчанию для страниц в sitemap.xml (0.0 - 1.0).",
    )
    default_sitemap_changefreq = models.CharField(
        max_length=20,
        default="weekly",
        choices=SITEMAP_CHANGEFREQ_CHOICES,
        help_text="Частота обновления по умолчанию для страниц в sitemap.xml.",
    )

    def __str__(self):
        return "Глобальные SEO настройки"

    class Meta:
        verbose_name = "Глобальные SEO настройки"
        verbose_name_plural = "Глобальные SEO настройки"
