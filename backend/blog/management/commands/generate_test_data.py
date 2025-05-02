import random

from blog.models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

fake = Faker("ru_RU")


class Command(BaseCommand):
    help = "Генерирует тестовые данные для блога"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Генерация тестовых данных..."))

        # Теги
        tags = []
        for _ in range(8):
            tag, _ = Tag.objects.get_or_create(
                name=fake.word().capitalize(), slug=fake.unique.slug()
            )
            tags.append(tag)
        self.stdout.write(self.style.SUCCESS(f"Создано тегов: {len(tags)}"))

        # Посты
        posts = []
        for i in range(15):
            post = Post.objects.create(
                title=fake.sentence(nb_words=6),
                slug=f"post-{i}-{fake.unique.slug()}",
                description=fake.text(max_nb_chars=120),
                body={
                    "blocks": [
                        {
                            "type": "text",
                            "data": {"text": fake.paragraph(nb_sentences=5)},
                        }
                    ]
                },
                first_published_at=timezone.now()
                - timezone.timedelta(days=random.randint(0, 365)),
                is_published=random.choice([True, True, True, False]),
            )
            post.tags.set(random.sample(tags, k=random.randint(1, 3)))
            posts.append(post)
        self.stdout.write(self.style.SUCCESS(f"Создано постов: {len(posts)}"))

        # Рейтинги
        ratings = 0
        for post in posts:
            for _ in range(random.randint(2, 8)):
                Rating.objects.create(
                    post=post, score=random.randint(1, 5), user_hash=fake.sha1()
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

        # Аналитика
        analytics = 0
        for _ in range(20):
            AnalyticsEvent.objects.create(
                path=fake.uri_path(),
                ip=fake.ipv4(),
                user_agent=fake.user_agent(),
                referrer=fake.uri(),
            )
            analytics += 1
        self.stdout.write(self.style.SUCCESS(f"Создано событий аналитики: {analytics}"))

        # Обратная связь
        contacts = 0
        for _ in range(8):
            ContactMessage.objects.create(
                name=fake.name(),
                email=fake.email(),
                message=fake.text(max_nb_chars=200),
            )
            contacts += 1
        self.stdout.write(
            self.style.SUCCESS(f"Создано сообщений обратной связи: {contacts}")
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Создано {Tag.objects.count()} тегов, {Post.objects.count()} постов, "
                f"{Rating.objects.count()} рейтингов, {ShortLink.objects.count()} коротких ссылок, "
                f"{AnalyticsEvent.objects.count()} событий аналитики, {ContactMessage.objects.count()} сообщений."
            )
        )

        self.stdout.write(self.style.SUCCESS("Тестовые данные успешно сгенерированы!"))
