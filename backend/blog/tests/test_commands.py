import pytest
from django.core.management import call_command


@pytest.mark.django_db
def test_convert_images_command_dry_run():
    call_command("convert_images_to_webp", "--dry-run")
