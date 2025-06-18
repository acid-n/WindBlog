from django.db import models


class SingletonModel(models.Model):
    """Простейшая реализация паттерна Singleton через pk=1."""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class SiteSettings(SingletonModel):
    title = models.CharField("Название сайта", max_length=120, default="Блог")
    tagline = models.CharField("Подпись", max_length=255, blank=True)

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def __str__(self) -> str:  # type: ignore[override]
        return self.title
