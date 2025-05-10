# flake8: noqa: F541
import json
import os
from io import BytesIO

from blog.models import Post
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image as PilImage


class Command(BaseCommand):
    help = "Converts existing post images and images in post bodies to WEBP format."

    def add_arguments(self, parser):
        parser.add_argument(
            "--quality",
            type=int,
            default=80,
            help="WEBP quality (0-100). Default is 80.",
        )
        parser.add_argument(
            "--method",
            type=int,
            default=4,
            help="WEBP encoding method (0-6, 0 is fast, 6 is best quality/slowest). Default is 4.",
        )
        parser.add_argument(
            "--lossless",
            action="store_true",
            help="Use lossless WEBP compression. Default is lossy.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulates the conversion process without actually modifying files or database.",
        )

    def handle(self, *args, **options):
        quality = options["quality"]
        method = options["method"]
        lossless = options["lossless"]
        dry_run = options["dry_run"]

        self.stdout.write(self.style.SUCCESS("Starting image conversion to WEBP..."))
        self.stdout.write(
            "Quality: "
            + str(quality)
            + ", Method: "
            + str(method)
            + ", Lossless: "
            + str(lossless)
            + ", Dry run: "
            + str(dry_run)
        )

        self.convert_post_main_images(quality, method, lossless, dry_run)
        self.convert_post_body_images(quality, method, lossless, dry_run)

        self.stdout.write(self.style.SUCCESS("Image conversion process finished."))

    def convert_image_file(self, image_field_file, quality, method, lossless, dry_run):
        """Converts an image file (from ImageField or path) to WEBP and returns new ContentFile and new name."""
        try:
            pil_img = PilImage.open(image_field_file)
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    "Error opening image " + image_field_file.name + ": " + str(e)
                )
            )
            return None, None

        # Если изображение уже WEBP, ничего не делаем (хотя лучше бы этого не случалось при первой миграции)
        if pil_img.format == "WEBP":
            self.stdout.write(
                "Image " + image_field_file.name + " is already WEBP. Skipping."
            )
            return None, None  # Сигнал, что конвертация не нужна

        original_filename_base = os.path.splitext(
            os.path.basename(image_field_file.name)
        )[0]
        new_filename = original_filename_base + ".webp"

        output_io = BytesIO()
        try:
            pil_img.save(
                output_io,
                format="WEBP",
                quality=quality,
                method=method,
                lossless=lossless,
            )
            output_io.seek(0)
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(
                    "Error converting image "
                    + image_field_file.name
                    + " to WEBP: "
                    + str(e)
                )
            )
            return None, None

        return ContentFile(output_io.read(), name=new_filename), new_filename

    def convert_post_main_images(self, quality, method, lossless, dry_run):
        self.stdout.write(self.style.WARNING("\n--- Converting Post.image fields ---"))
        posts_with_images = Post.objects.exclude(image__exact="").exclude(
            image__isnull=True
        )
        converted_count = 0
        skipped_count = 0

        for post in posts_with_images:
            if not post.image:
                continue

            original_image_path = post.image.path
            original_image_name = post.image.name
            self.stdout.write(
                "Processing Post ID "
                + str(post.id)
                + " ('"
                + post.title
                + "'): "
                + original_image_name
            )

            if original_image_name.lower().endswith(".webp"):
                skipped_count += 1
                continue

            try:
                with open(original_image_path, "rb") as f:
                    webp_content_file, new_webp_name = self.convert_image_file(
                        f, quality, method, lossless, dry_run
                    )

                if webp_content_file and new_webp_name:
                    if not dry_run:
                        # Удаляем старый файл
                        if os.path.exists(original_image_path):
                            os.remove(original_image_path)
                            self.stdout.write(
                                self.style.SUCCESS(
                                    "  Deleted old file: " + original_image_path
                                )
                            )

                        # Сохраняем новый файл и обновляем модель
                        post.image.save(
                            new_webp_name, webp_content_file, save=False
                        )  # save=False чтобы не вызывать полный save модели
                        post.save(
                            update_fields=["image", "updated_at"]
                        )  # Сохраняем только нужные поля
                        self.stdout.write(
                            self.style.SUCCESS(
                                "  Successfully converted and saved: " + post.image.name
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(
                                "  [DRY RUN] Would convert "
                                + original_image_name
                                + " to "
                                + new_webp_name
                            )
                        )
                        self.stdout.write(
                            self.style.SUCCESS(
                                "  [DRY RUN] Would delete old file: "
                                + original_image_path
                            )
                        )
                    converted_count += 1
                else:
                    self.stderr.write(
                        self.style.ERROR(
                            "  Failed to convert "
                            + original_image_name
                            + " for Post ID "
                            + str(post.id)
                            + "."
                        )
                    )
                    skipped_count += 1

            except FileNotFoundError:
                self.stderr.write(
                    self.style.ERROR(
                        "  File not found for Post ID "
                        + str(post.id)
                        + ": "
                        + original_image_path
                        + ". Skipping."
                    )
                )
                skipped_count += 1
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        "  Unexpected error processing Post ID "
                        + str(post.id)
                        + " ("
                        + original_image_name
                        + "): "
                        + str(e)
                    )
                )
                skipped_count += 1

        self.stdout.write(
            "Post.image conversion: "
            + str(converted_count)
            + " converted, "
            + str(skipped_count)
            + " skipped/failed."
        )

    def convert_post_body_images(self, quality, method, lossless, dry_run):
        self.stdout.write(
            self.style.WARNING(
                "\n--- Converting images in Post.body (CKEditor content) ---"
            )
        )
        # Это более сложная часть. CKEditor5 сохраняет тело в JSON-подобной структуре.
        # Нам нужно будет парсить это, находить блоки типа 'image', получать их URL,
        # скачивать/открывать файл, конвертировать, сохранять и обновлять URL в JSON.

        posts_with_body = Post.objects.exclude(body__isnull=True).exclude(
            body__exact=""
        )
        updated_posts_count = 0
        # Счетчик для изображений в теле, не постов
        converted_body_images_count = 0
        skipped_body_images_count = 0

        for post in posts_with_body:
            try:
                # Тело поста из CKEditor5Field - это строка JSON
                body_content = json.loads(post.body)
                if not isinstance(body_content, dict) or "blocks" not in body_content:
                    self.stdout.write(
                        self.style.NOTICE(
                            "Post ID "
                            + str(post.id)
                            + ": body is not a valid CKEditor JSON structure. Skipping body."
                        )
                    )
                    continue
            except json.JSONDecodeError:
                self.stdout.write(
                    self.style.NOTICE(
                        "Post ID "
                        + str(post.id)
                        + ": body is not valid JSON. Skipping body."
                    )
                )
                continue  # или другая обработка, если это HTML, а не JSON

            made_changes_to_body = False
            for block in body_content.get("blocks", []):
                if block.get("type") == "image":
                    image_url = block.get("data", {}).get("url")
                    if not image_url or not image_url.startswith(settings.MEDIA_URL):
                        # Пропускаем внешние URL или некорректные
                        continue

                    if image_url.lower().endswith(".webp"):
                        continue  # Пропускаем, если уже webp

                    # Преобразуем URL в относительный путь к файлу в MEDIA_ROOT
                    relative_path = image_url[len(settings.MEDIA_URL) :]
                    original_file_path = os.path.join(
                        settings.MEDIA_ROOT, relative_path
                    )

                    self.stdout.write(
                        "  Post ID "
                        + str(post.id)
                        + ": Processing body image "
                        + image_url
                    )

                    try:
                        with open(original_file_path, "rb") as f:
                            webp_content_file, new_webp_name = self.convert_image_file(
                                f, quality, method, lossless, dry_run
                            )

                        if webp_content_file and new_webp_name:
                            # Новый путь к файлу относительно MEDIA_ROOT
                            new_webp_relative_path = os.path.join(
                                os.path.dirname(relative_path), new_webp_name
                            ).replace("\\", "/")
                            new_webp_url = str(settings.MEDIA_URL) + str(
                                new_webp_relative_path
                            )

                            if not dry_run:
                                # Сохраняем новый файл по тому же пути (относительно MEDIA_ROOT), но с новым именем
                                new_file_storage_path = os.path.join(
                                    settings.MEDIA_ROOT, new_webp_relative_path
                                )
                                os.makedirs(
                                    os.path.dirname(new_file_storage_path),
                                    exist_ok=True,
                                )
                                with open(new_file_storage_path, "wb") as new_f:
                                    new_f.write(webp_content_file.read())
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        "    Saved new body image: "
                                        + new_file_storage_path
                                    )
                                )

                                # Удаляем старый файл
                                if (
                                    os.path.exists(original_file_path)
                                    and original_file_path != new_file_storage_path
                                ):
                                    os.remove(original_file_path)
                                    self.stdout.write(
                                        self.style.SUCCESS(
                                            "    Deleted old body image: "
                                            + original_file_path
                                        )
                                    )

                                # Обновляем URL в блоке
                                block["data"]["url"] = new_webp_url
                                made_changes_to_body = True
                                converted_body_images_count += 1
                            else:
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        "    [DRY RUN] Would convert body image "
                                        + original_file_path
                                        + " to "
                                        + new_webp_name
                                    )
                                )
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        "    [DRY RUN] New URL would be " + new_webp_url
                                    )
                                )
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        "    [DRY RUN] Would delete old file: "
                                        + original_file_path
                                    )
                                )
                                converted_body_images_count += (
                                    1  # Считаем как "обработанное" в dry-run
                                )
                        else:
                            self.stderr.write(
                                self.style.ERROR(
                                    "    Failed to convert body image "
                                    + original_file_path
                                )
                            )
                            skipped_body_images_count += 1

                    except FileNotFoundError:
                        self.stderr.write(
                            self.style.ERROR(
                                "    Body image file not found: "
                                + original_file_path
                                + ". Skipping."
                            )
                        )
                        skipped_body_images_count += 1
                    except Exception as e:
                        self.stderr.write(
                            self.style.ERROR(
                                "    Unexpected error processing body image "
                                + original_file_path
                                + ": "
                                + str(e)
                            )
                        )
                        skipped_body_images_count += 1

            if made_changes_to_body and not dry_run:
                post.body = json.dumps(body_content)
                post.save(update_fields=["body", "updated_at"])
                updated_posts_count += 1
                self.stdout.write(
                    self.style.SUCCESS("  Updated body for Post ID " + str(post.id))
                )

        self.stdout.write(
            "Post.body image conversion: "
            + str(converted_body_images_count)
            + " images converted/simulated, "
            + str(skipped_body_images_count)
            + " images skipped/failed."
        )
        if not dry_run:
            self.stdout.write(
                "Updated " + str(updated_posts_count) + " post bodies in the database."
            )
        else:
            self.stdout.write(
                "[DRY RUN] Updated "
                + str(updated_posts_count)
                + " post bodies would have been updated (this count is likely 0 in dry_run for body as changes are per image)."
            )
