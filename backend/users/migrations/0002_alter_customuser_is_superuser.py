# Generated by Django 5.2 on 2025-05-04 06:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="customuser",
            name="is_superuser",
            field=models.BooleanField(
                default=False,
                help_text=(
                    "Designates that this user has all permissions "
                    "without explicitly assigning them."
                ),
                verbose_name="superuser status",
            ),
        ),
    ]
