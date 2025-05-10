from django.db import models


class SiteSettings(models.Model):
    site_title = models.CharField(max_length=128, default="MyBlog")
    site_description = models.CharField(max_length=256, blank=True, default="")

    class Meta:
        verbose_name = "Настройка сайта"
        verbose_name_plural = "Настройки сайта"

    def __str__(self):
        return self.site_title
