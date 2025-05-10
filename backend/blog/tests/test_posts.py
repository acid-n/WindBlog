import os
from io import BytesIO

import factory
import pytest
from blog.models import Post, Tag
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image as PilImage
from rest_framework.test import APIClient


class TagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Tag

    name = factory.Sequence(lambda n: f"tag{n}")
    slug = factory.Sequence(lambda n: f"tag{n}")


class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post

    title = factory.Sequence(lambda n: f"Post {n}")
    slug = factory.Sequence(lambda n: f"post-{n}")
    description = "desc"
    body = '{"blocks": [], "version": "2.22.2"}'
    first_published_at = "2024-01-01T00:00:00Z"
    is_published = True


@pytest.mark.django_db
class TestPostAPI:
    def setup_method(self):
        self.client = APIClient()
        self.tag = TagFactory()
        self.post = PostFactory()
        self.post.tags.add(self.tag)

    # def test_post_list(self):
    #     url = reverse("post-list")
    #     response = self.client.get(url)
    #     assert response.status_code == 200
    #     assert isinstance(response.data, dict)
    #     assert "results" in response.data
    #     assert isinstance(response.data["results"], list)
    #     assert any(p["id"] == self.post.id for p in response.data["results"])

    # def test_post_detail(self):
    #     url = reverse("post-detail", args=[self.post.slug])
    #     response = self.client.get(url)
    #     assert response.status_code == 200
    #     assert response.data["id"] == self.post.id


# Вспомогательная функция для создания простого изображения в памяти
def create_dummy_image(filename="test.jpg", format="JPEG"):
    img = PilImage.new("RGB", (60, 30), color="red")
    buffer = BytesIO()
    img.save(buffer, format=format)
    buffer.seek(0)
    return SimpleUploadedFile(
        filename, buffer.read(), content_type=f"image/{format.lower()}"
    )


# Вспомогательная функция для создания WEBP изображения в памяти
def create_dummy_webp_image(filename="test.webp"):
    img = PilImage.new("RGB", (60, 30), color="green")
    buffer = BytesIO()
    img.save(buffer, format="WEBP")
    buffer.seek(0)
    return SimpleUploadedFile(filename, buffer.read(), content_type="image/webp")


@pytest.mark.django_db
def test_post_creation():
    """Тест: Базовое создание поста."""
    tag = Tag.objects.create(name="Test Tag", slug="test-tag")
    post = Post.objects.create(
        title="Test Post Title",
        slug="test-post-title",
        first_published_at=timezone.now(),
    )
    post.tags.add(tag)
    assert post.title == "Test Post Title"
    assert post.slug == "test-post-title"
    assert tag in post.tags.all()


@pytest.mark.django_db
def test_post_ordering():
    """Тест: Проверка правильной сортировки постов по дате."""
    tag = Tag.objects.create(name="Ordering Test", slug="ordering-test")
    now = timezone.now()
    post1 = Post.objects.create(
        title="Post 1",
        slug="post-1",
        first_published_at=now - timezone.timedelta(days=1),
    )
    post2 = Post.objects.create(title="Post 2", slug="post-2", first_published_at=now)
    post1.tags.add(tag)
    post2.tags.add(tag)

    posts = Post.objects.filter(tags=tag)  # Запрос должен использовать ordering из Meta
    assert list(posts) == [post2, post1]  # Проверяем порядок: сначала новые


@pytest.mark.django_db
def test_post_image_webp_validation_success():
    """Тест: Успешное сохранение поста с WEBP изображением."""
    webp_image = create_dummy_webp_image()
    post = Post(
        title="Post with WEBP",
        slug="post-with-webp",
        first_published_at=timezone.now(),
        image=webp_image,
    )
    try:
        post.full_clean()  # Проверяем валидацию
        post.save()  # Сохраняем
    except ValidationError as e:
        pytest.fail(f"ValidationError was raised unexpectedly: {e}")

    assert Post.objects.filter(slug="post-with-webp").exists()
    saved_post = Post.objects.get(slug="post-with-webp")
    assert saved_post.image.name.endswith(".webp")
    # Очистка медиафайла после теста
    if saved_post.image and hasattr(saved_post.image, "path") and saved_post.image.path:
        if os.path.exists(saved_post.image.path):
            try:
                os.remove(saved_post.image.path)
            except OSError as e:
                print(
                    f"Warning: could not remove test file {saved_post.image.path}: {e}"
                )


@pytest.mark.django_db
def test_post_image_non_webp_validation_fail():
    """Тест: Ошибка валидации при попытке сохранить пост с не-WEBP изображением."""
    jpg_image = create_dummy_image(filename="test.jpg", format="JPEG")
    post = Post(
        title="Post with JPG",
        slug="post-with-jpg",
        first_published_at=timezone.now(),
        image=jpg_image,
    )

    with pytest.raises(ValidationError) as excinfo:
        post.full_clean()

    assert "Неподдерживаемый формат файла" in str(excinfo.value)
    assert "image" in excinfo.value.message_dict

    assert not Post.objects.filter(slug="post-with-jpg").exists()


@pytest.mark.django_db
def test_post_body_text_for_search_update():
    """Тест: Проверка обновления поля body_text_for_search при сохранении."""
    # Закомментировано, если поле body_text_for_search не обновляется автоматически
