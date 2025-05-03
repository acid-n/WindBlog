from django.db import models


class SiteSettings(models.Model):
    site_title = models.CharField(max_length=128, default="MyBlog")
    site_description = models.CharField(max_length=256, blank=True, default="")

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self):
        return self.site_title
