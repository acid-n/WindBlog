import os

import django
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from blog.models import Post, Tag  # noqa: E402

# Создаем или получаем тестовый тег
TAG_NAME = "тест-типография"
tag, _ = Tag.objects.get_or_create(name=TAG_NAME, slug="test-typography")

# Пример типографического контента (ProseMirror JSON)
body = {
    "type": "doc",
    "content": [
        {
            "type": "heading",
            "attrs": {"level": 1},
            "content": [{"type": "text", "text": "Заголовок H1"}],
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "Заголовок H2"}],
        },
        {
            "type": "paragraph",
            "content": [
                {"type": "text", "text": "Обычный параграф с "},
                {"type": "text", "marks": [{"type": "bold"}], "text": "жирным"},
                {"type": "text", "text": " и "},
                {"type": "text", "marks": [{"type": "italic"}], "text": "курсивом"},
            ],
        },
        {
            "type": "bulletList",
            "content": [
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Маркированный список — пункт 1",
                                }
                            ],
                        }
                    ],
                },
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Маркированный список — пункт 2",
                                }
                            ],
                        }
                    ],
                },
            ],
        },
        {
            "type": "orderedList",
            "attrs": {"order": 1},
            "content": [
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Нумерованный список — пункт 1",
                                }
                            ],
                        }
                    ],
                },
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Нумерованный список — пункт 2",
                                }
                            ],
                        }
                    ],
                },
            ],
        },
        {
            "type": "blockquote",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Это цитата."}],
                }
            ],
        },
        {
            "type": "codeBlock",
            "attrs": {"language": "python"},
            "content": [{"type": "text", "text": "print('Hello, world!')"}],
        },
        {
            "type": "paragraph",
            "content": [
                {"type": "text", "text": "Ссылка: "},
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {"href": "https://google.com", "target": "_blank"},
                        }
                    ],
                    "text": "Google",
                },
            ],
        },
        {
            "type": "image",
            "attrs": {
                "src": "/media/posts/uploads/example.webp",
                "alt": "Пример изображения",
                "title": "Image Title",
            },
        },
        {"type": "paragraph", "content": [{"type": "text", "text": "\n"}]},
        {"type": "paragraph", "content": [{"type": "text", "text": "Таблица:"}]},
        {
            "type": "table",
            "content": [
                {
                    "type": "tableRow",
                    "content": [
                        {
                            "type": "tableHeader",
                            "content": [{"type": "text", "text": "Колонка 1"}],
                        },
                        {
                            "type": "tableHeader",
                            "content": [{"type": "text", "text": "Колонка 2"}],
                        },
                    ],
                },
                {
                    "type": "tableRow",
                    "content": [
                        {
                            "type": "tableCell",
                            "content": [{"type": "text", "text": "Значение 1"}],
                        },
                        {
                            "type": "tableCell",
                            "content": [{"type": "text", "text": "Значение 2"}],
                        },
                    ],
                },
            ],
        },
    ],
}

post = Post.objects.create(
    title="Тест типографики",
    slug="test-typography",
    description="Пост для проверки всех элементов типографики на фронте.",
    body=body,
    is_published=True,
    first_published_at=timezone.now(),
    created_at=timezone.now(),
    updated_at=timezone.now(),
)
post.tags.add(tag)
post.save()

print(f"Создан пост с id={post.id} и slug={post.slug}")
