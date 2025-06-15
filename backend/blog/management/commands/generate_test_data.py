import random

import requests
from blog.models import Post, Rating, ShortLink, Tag
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

fake = Faker("ru_RU")


def get_random_image_url():
    services = [
        lambda: "https://picsum.photos/seed/{}/800/600".format(
            random.randint(1, 10000)
        ),
        lambda: "https://placekitten.com/800/600",
        lambda: "https://loremflickr.com/800/600/nature,water",
    ]
    return random.choice(services)()


def download_image_to_field(url, filename):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return ContentFile(response.content, name=filename)
    except Exception:
        pass
    return None


class Command(BaseCommand):
    help = "Генерирует тестовые данные для блога"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Генерация тестовых данных..."))

        # Теги
        tags = list(Tag.objects.all())
        while len(tags) < 8:
            tag, _ = Tag.objects.get_or_create(
                name=fake.word().capitalize(), slug=fake.unique.slug()
            )
            tags.append(tag)
        self.stdout.write(self.style.SUCCESS(f"Тегов всего: {len(tags)}"))

        # Посты
        posts = []
        for i in range(10):
            # Горизонтальная и узкая обложка (1200x400)
            url = f"https://picsum.photos/seed/{random.randint(1, 10000)}/1200/400"
            filename = (
                f"post_{random.randint(10000, 99999)}_{random.randint(1000, 9999)}.jpg"
            )
            image_file = download_image_to_field(url, filename)

            # Лаконичный анонс (1-2 предложения, <=180 символов, без обрыва слова)
            raw_text = fake.paragraph(nb_sentences=2)
            if len(raw_text) > 180:
                cut = raw_text[:180]
                last_dot = cut.rfind(".")
                last_space = cut.rfind(" ")
                if last_dot > 50:
                    description = cut[: last_dot + 1]
                elif last_space > 50:
                    description = cut[:last_space] + "..."
                else:
                    description = cut + "..."
            else:
                description = raw_text

            # Генерация body с полной типографикой
            blocks = []
            # Заголовок
            blocks.append(
                {"type": "heading", "data": {"text": fake.sentence(nb_words=8)}}
            )
            # Параграф
            blocks.append(
                {"type": "text", "data": {"text": fake.paragraph(nb_sentences=5)}}
            )
            # Картинка слева
            img1_url = f"https://picsum.photos/seed/{random.randint(1, 10000)}/600/400"
            img1_filename = f"body_{random.randint(10000, 99999)}_left_{random.randint(1000, 9999)}.jpg"
            img1_file = download_image_to_field(img1_url, img1_filename)
            if img1_file:
                img1_path = f"/media/posts/{img1_filename}"
                with open(f"backend/media/posts/{img1_filename}", "wb") as f:
                    f.write(img1_file.read())
                blocks.append(
                    {
                        "type": "image",
                        "data": {
                            "url": img1_path,
                            "alt": "Картинка слева",
                            "float": "left",
                        },
                    }
                )
            # Параграф
            blocks.append(
                {"type": "text", "data": {"text": fake.paragraph(nb_sentences=4)}}
            )
            # Картинка справа
            img2_url = f"https://picsum.photos/seed/{random.randint(1, 10000)}/600/400"
            img2_filename = f"body_{random.randint(10000, 99999)}_right_{random.randint(1000, 9999)}.jpg"
            img2_file = download_image_to_field(img2_url, img2_filename)
            if img2_file:
                img2_path = f"/media/posts/{img2_filename}"
                with open(f"backend/media/posts/{img2_filename}", "wb") as f:
                    f.write(img2_file.read())
                blocks.append(
                    {
                        "type": "image",
                        "data": {
                            "url": img2_path,
                            "alt": "Картинка справа",
                            "float": "right",
                        },
                    }
                )
            # Параграф
            blocks.append(
                {"type": "text", "data": {"text": fake.paragraph(nb_sentences=4)}}
            )
            # Картинка по центру
            img3_url = f"https://picsum.photos/seed/{random.randint(1, 10000)}/800/400"
            img3_filename = f"body_{random.randint(10000, 99999)}_center_{random.randint(1000, 9999)}.jpg"
            img3_file = download_image_to_field(img3_url, img3_filename)
            if img3_file:
                img3_path = f"/media/posts/{img3_filename}"
                with open(f"backend/media/posts/{img3_filename}", "wb") as f:
                    f.write(img3_file.read())
                blocks.append(
                    {
                        "type": "image",
                        "data": {
                            "url": img3_path,
                            "alt": "Картинка по центру",
                            "float": "center",
                        },
                    }
                )
            # Цитата
            blocks.append(
                {"type": "quote", "data": {"text": fake.sentence(nb_words=20)}}
            )
            # Код
            code_sample = """def hello_world():\n    print('Hello, world!')\n\n# Пример функции\ndef add(a, b):\n    return a + b\n"""
            blocks.append({"type": "code", "data": {"code": code_sample}})
            # Галерея
            gallery_imgs = []
            for j in range(3):
                g_url = f"https://picsum.photos/seed/{random.randint(1, 10000)}/400/400"
                g_filename = f"gallery_{random.randint(10000, 99999)}_{j}_{random.randint(1000, 9999)}.jpg"
                g_file = download_image_to_field(g_url, g_filename)
                if g_file:
                    g_path = f"/media/posts/{g_filename}"
                    with open(f"backend/media/posts/{g_filename}", "wb") as f:
                        f.write(g_file.read())
                    gallery_imgs.append({"url": g_path, "alt": f"Галерея {j + 1}"})
            if gallery_imgs:
                blocks.append({"type": "gallery", "data": {"images": gallery_imgs}})
            # Видео
            blocks.append(
                {
                    "type": "video",
                    "data": {
                        "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                        "title": "YouTube Example",
                    },
                }
            )
            # Ссылка
            blocks.append(
                {
                    "type": "link",
                    "data": {
                        "url": "https://themes.pixelwars.org/read-wp/",
                        "text": "Оригинальная тема Read WP",
                    },
                }
            )
            # Список
            blocks.append(
                {
                    "type": "text",
                    "data": {
                        "text": "\n- Первый пункт списка\n- Второй пункт списка\n- Третий пункт списка"
                    },
                }
            )
            # Таблица (имитация)
            table_md = "| Заголовок 1 | Заголовок 2 |\n|-------------|-------------|\n| Ячейка 1    | Ячейка 2    |\n| Ячейка 3    | Ячейка 4    |"
            blocks.append({"type": "text", "data": {"text": table_md}})
            # Ещё текст для объёма
            while sum(len(str(b)) for b in blocks) < 5000:
                blocks.append(
                    {"type": "text", "data": {"text": fake.paragraph(nb_sentences=10)}}
                )

            post = Post.objects.create(
                title=fake.sentence(nb_words=6),
                slug=f"post-{random.randint(10000, 99999)}-{fake.unique.slug()}",
                description=description,
                body={"blocks": blocks},
                first_published_at=timezone.now()
                - timezone.timedelta(days=random.randint(0, 365)),
                is_published=True,
                image=image_file,
            )
            post.tags.set(random.sample(tags, k=random.randint(1, 3)))
            posts.append(post)
        self.stdout.write(self.style.SUCCESS(f"Создано постов: {len(posts)}"))

        # Рейтинги
        ratings = 0
        for post in posts:
            for _ in range(random.randint(0, 5)):
                Rating.objects.create(
                    post=post,
                    score=random.randint(1, 5),
                    user_hash=fake.sha1(),
                )
                ratings += 1
        self.stdout.write(self.style.SUCCESS(f"Создано рейтингов: {ratings}"))

        # Короткие ссылки
        shortlinks = 0
        for post in random.sample(posts, k=len(posts) // 2):
            ShortLink.objects.get_or_create(
                post=post, code=fake.unique.lexify(text="??????")
            )
            shortlinks += 1
        self.stdout.write(self.style.SUCCESS(f"Создано коротких ссылок: {shortlinks}"))

        # Аналитика и обратная связь больше не используются

        self.stdout.write(
            self.style.SUCCESS(
                "Создано {} тегов, {} постов, {} рейтингов, {} коротких ссылок.".format(
                    Tag.objects.count(),
                    Post.objects.count(),
                    Rating.objects.count(),
                    ShortLink.objects.count(),
                )
            )
        )

        self.stdout.write(self.style.SUCCESS("Тестовые данные успешно сгенерированы!"))
