# Generated by Django 5.2 on 2025-05-07 19:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0004_post_sitemap_changefreq_post_sitemap_include_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="shortlink",
            name="code",
            field=models.CharField(
                blank=True, editable=False, max_length=8, unique=True
            ),
        ),
    ]
