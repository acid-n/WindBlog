# Generated by Django 5.2 on 2025-05-04 06:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="contactmessage",
            name="short_url",
        ),
    ]
