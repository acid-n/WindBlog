import logging

from django.conf import settings
from django.db.models import Avg
from rest_framework import serializers
from rest_framework.settings import api_settings

from .models import Post, Rating, ShortLink, Tag

# Убедимся, что ContentFile импортирован, если понадобится для CustomImageField
# from django.core.files.base import ContentFile


logger = logging.getLogger(__name__)


class CustomImageField(serializers.ImageField):
    def to_internal_value(self, data):
        # Если это строка (предположительно путь к файлу),
        # и это не файл из multipart-запроса (т.е. нет в self.context['request'].FILES)
        # или если self.context['request'].FILES пуст (на случай если его там вообще нет при JSON запросе)
        files = self.context["request"].FILES
        # Если 'data' это строка и ( (нет 'image' в files) или (есть 'image' в files и data не является ключом в files['image']) )
        # Это условие сложное. По сути, если data - это строка, и она не является именем загруженного файла, то это путь.
        if isinstance(data, str) and (
            not files or data not in files.get(self.field_name, [])
        ):
            if not data:
                return False

            return data
        try:
            processed_data = super().to_internal_value(data)

            return processed_data
        except serializers.ValidationError as e:

            # Попытка вернуть строку, если стандартный обработчик не смог принять ее как файл
            if isinstance(data, str) and any(
                "The submitted data was not a file." in str(detail)
                for detail_list in e.detail.values()
                for detail in detail_list
                if isinstance(detail, (str, serializers.ValidationError))
            ):  # Проверяем все сообщения об ошибках
                # print(
                #     "[CustomImageField DEBUG] Caught 'not a file' error for string data " + str(data) + ", attempting to return string path directly."
                # )
                # print(
                #     "[CustomImageField DEBUG] === to_internal_value END (returned string path after super error) ===\n"
                # )
                return data
            # print(
            #     "[CustomImageField DEBUG] === to_internal_value END (raised ValidationError) ===\n"
            # )
            raise e

    def to_representation(self, value):
        # Эта часть отвечает за то, как данные отдаются фронтенду
        # value здесь - это экземпляр FieldFile или None

        # ---- Начало Отладки ----
        # print("\n[CustomImageField DEBUG] === to_representation START ===")
        if hasattr(value, "name"):
            # print("[CustomImageField DEBUG] Input value.name: " + str(value.name))
            pass
        else:
            # print(
            #     "[CustomImageField DEBUG] Input value: " + str(value) + " (type: " + str(type(value)) + ")"
            # )
            pass
        # ---- Конец Отладки ----

        if not value:
            # print("[CustomImageField DEBUG] Value is None or empty, returning None.")
            # print(
            #     "[CustomImageField DEBUG] === to_representation END (returned None) ===\n"
            # )
            return None

        use_url = getattr(self, "use_url", api_settings.UPLOADED_FILES_USE_URL)

        if use_url:
            try:
                url = value.url
                # print(
                #     "[CustomImageField DEBUG] use_url is True. value.name='" + str(getattr(value, 'name', 'N/A')) + "', generated value.url='" + str(url) + "'"
                # )
                # print(
                #     "[CustomImageField DEBUG] === to_representation END (returned URL) ===\n"
                # )
                return url
            except AttributeError:
                # Это может произойти, если 'value' - это строка (например, относительный путь),
                # а не объект FieldFile с методом .url().
                # Этого не должно происходить, если to_internal_value и модель работают правильно,
                # так как 'value' приходящее сюда должно быть уже объектом FieldFile.
                # Но если это все же строка, и use_url=True, нам нужно построить URL.
                # print(
                #     "[CustomImageField DEBUG] AttributeError getting value.url. Value is " + str(value) + ". Attempting to build URL manually."
                # )
                # Предполагаем, что 'value' это относительный путь от MEDIA_ROOT
                # Проверяем, не является ли value уже полным URL (маловероятно здесь, но для полноты)
                if isinstance(value, str) and (
                    value.startswith("http://") or value.startswith("https://")
                ):
                    # print(
                    #     "[CustomImageField DEBUG] Value " + str(value) + " is already a full URL. Returning it."
                    # )
                    # print(
                    #     "[CustomImageField DEBUG] === to_representation END (returned existing full URL string) ===\n"
                    # )
                    return value

                # Строим URL относительно MEDIA_URL
                # Убедимся, что MEDIA_URL существует и имеет корректный формат
                media_url = getattr(settings, "MEDIA_URL", None)
                if not media_url:
                    # print(
                    #     "[CustomImageField DEBUG] settings.MEDIA_URL is not set. Cannot build URL. Returning string value as is."
                    # )
                    # print(
                    #     "[CustomImageField DEBUG] === to_representation END (returned string due to no MEDIA_URL) ===\n"
                    # )
                    return str(
                        value
                    )  # Возвращаем как есть, если не можем построить URL

                # Собираем URL, избегая двойных слешей
                # value может быть 'posts/uploads/file.jpg'
                # media_url может быть '/media/'
                path_value = str(value)

                # Убираем ведущий слеш из path_value, если media_url им заканчивается
                if media_url.endswith("/") and path_value.startswith("/"):
                    path_value = path_value[1:]
                # Добавляем слеш к media_url, если его нет и path_value с него не начинается
                elif not media_url.endswith("/") and not path_value.startswith("/"):
                    media_url += "/"

                full_url = str(media_url) + str(path_value)
                # print(
                #     "[CustomImageField DEBUG] Manually constructed URL: " + str(full_url) + " from MEDIA_URL: '" + str(settings.MEDIA_URL) + "' and value: " + str(value) + "'"
                # )
                # print(
                #     "[CustomImageField DEBUG] === to_representation END (returned manually built URL) ===\n"
                # )
                return full_url
        else:
            # Если use_url=False, возвращаем просто имя файла (относительный путь от MEDIA_ROOT)
            name_to_return = str(value.name) if hasattr(value, "name") else str(value)
            # print(
            #     "[CustomImageField DEBUG] use_url is False. Returning name: " + str(name_to_return)
            # )
            # print(
            #     "[CustomImageField DEBUG] === to_representation END (returned name/path) ===\n"
            # )
            return name_to_return


class TagSerializer(serializers.ModelSerializer):
    """Сериализатор для тегов."""

    posts_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Tag
        fields = ["id", "name", "slug", "posts_count"]


class ShortLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для коротких ссылок."""

    class Meta:
        model = ShortLink
        fields = ["id", "post", "code"]


class PostSerializer(serializers.ModelSerializer):
    """Сериализатор для постов блога."""

    tags_details = TagSerializer(source="tags", many=True, read_only=True)
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )
    shortlink = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    # Используем наше кастомное поле
    image = CustomImageField(
        required=False, allow_null=True, use_url=True, max_length=None
    )

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "body",
            "image",
            "tags",
            "tags_details",
            "first_published_at",
            "is_published",
            "created_at",
            "updated_at",
            "shortlink",
            "average_rating",
            "sitemap_include",
            "sitemap_priority",
            "sitemap_changefreq",
        ]

    def get_shortlink(self, obj: Post):
        """Получить данные короткой ссылки поста, если она существует."""
        try:
            short_link_instance = obj.shortlinks.first()

            if short_link_instance and short_link_instance.code:
                request = self.context.get("request")
                host = request.get_host() if request else None
                protocol = "https" if request and request.is_secure() else "http"
                base_url = str(protocol) + "://" + (str(host) if host else "")

                relative_url = "/s/" + str(short_link_instance.code) + "/"

                return {
                    "code": short_link_instance.code,
                    "url": relative_url,
                    "full_url": (base_url + relative_url) if base_url else None,
                }
            return None
        except Exception as e:
            logger.error(
                "Ошибка при получении короткой ссылки для поста "
                + str(obj.id)
                + ": "
                + str(e)
            )
            return None

    def get_average_rating(self, obj: Post):
        """Получить среднюю оценку поста."""
        avg_data = obj.ratings.aggregate(avg_score=Avg("score"))
        avg_score = avg_data.get("avg_score")
        return round(avg_score, 1) if avg_score is not None else None


class RatingSerializer(serializers.ModelSerializer):
    """Сериализатор для рейтинга поста."""

    class Meta:
        model = Rating
        fields = ["id", "post", "score", "user_hash", "created_at"]


# Сериализаторы для API Архива
class YearArchiveSerializer(serializers.Serializer):
    """Сериализатор для годовой сводки архива."""

    year = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class MonthArchiveSerializer(serializers.Serializer):
    """Сериализатор для месячной сводки архива."""

    month = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class DayArchiveSerializer(serializers.Serializer):
    """Сериализатор для дневной сводки архива."""

    day = serializers.IntegerField()
    posts_count = serializers.IntegerField()
