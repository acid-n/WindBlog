import datetime
import logging  # Добавляем импорт logging
import os
import uuid
from io import BytesIO

from django.conf import settings
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncMonth, TruncYear
from django.http import Http404, HttpResponseRedirect, JsonResponse
from django.utils.text import slugify  # <--- ДОБАВЛЯЕМ ЭТОТ ИМПОРТ
from PIL import Image as PilImage
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView, View

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag
from .serializers import (
    AnalyticsEventSerializer,
    ContactMessageSerializer,
    DayArchiveSerializer,
    MonthArchiveSerializer,
    PostSerializer,
    RatingSerializer,
    ShortLinkSerializer,
    TagSerializer,
    YearArchiveSerializer,
)

# Получаем логгер
logger = logging.getLogger(__name__)


class PostViewSet(viewsets.ModelViewSet):
    """API для постов блога."""

    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    pagination_class = PageNumberPagination  # Возвращаем стандартный пагинатор

    def get_queryset(self):
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            queryset = Post.objects.all()
        else:
            queryset = Post.objects.filter(is_published=True)

        search_term = self.request.query_params.get("search", None)
        is_for_sitemap = (
            self.request.query_params.get("for_sitemap", "false").lower() == "true"
        )
        show_drafts = self.request.query_params.get("drafts", "false").lower() == "true"

        if self.action == "list" and show_drafts and self.request.user.is_authenticated:
            queryset = Post.objects.filter(is_published=False)
        elif is_for_sitemap:
            queryset = queryset.filter(is_published=True, sitemap_include=True)
            queryset = queryset.order_by("-first_published_at")
        elif search_term:
            search_language = getattr(settings, "SEARCH_LANGUAGE", "russian")
            vector = SearchVector(
                "title",
                "slug",
                "description",
                "body_text_for_search",
                config=search_language,
            )
            query = SearchQuery(
                search_term, config=search_language, search_type="websearch"
            )
            queryset = (
                queryset.annotate(rank=SearchRank(vector, query))
                .filter(rank__gte=0.01)
                .order_by("-rank", "-first_published_at")
            )
        elif self.action == "list":
            queryset = queryset.order_by("-first_published_at")

        # Оптимизация: подгружаем связанные объекты
        queryset = queryset.prefetch_related("tags", "ratings", "shortlinks")
        return queryset

    def paginate_queryset(self, queryset):
        """Отключаем пагинацию, если запрошено для sitemap."""
        is_for_sitemap = (
            self.request.query_params.get("for_sitemap", "false").lower() == "true"
        )
        if is_for_sitemap:
            logger.debug("Disabling pagination for sitemap request.")
            return None  # Возвращаем None для отключения пагинации

        # Для обычных запросов используем пагинацию по умолчанию, вызывая метод суперкласса
        logger.debug("Using default pagination.")
        return super().paginate_queryset(queryset)

    @action(detail=True, methods=["get"], url_path="by-id")
    def get_by_id(self, request, slug=None):
        """Получить пост по ID (для коротких ссылок)."""
        try:
            post_id = int(slug)
            post = Post.objects.filter(id=post_id, is_published=True).first()

            if not post:
                return Response(
                    {"error": "Пост не найден", "details": f"ID: {post_id}"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            serializer = self.get_serializer(post)
            return Response(serializer.data)
        except (ValueError, TypeError) as e:
            return Response(
                {"error": "Неверный ID поста", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "Внутренняя ошибка сервера", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TagViewSet(viewsets.ModelViewSet):
    """API для тегов."""

    queryset = Tag.objects.all().order_by("name").prefetch_related("posts")
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        qs = Tag.objects.all().order_by("name").prefetch_related("posts")
        if self.action == "list":
            return qs.annotate(
                posts_count=Count("posts", filter=Q(posts__is_published=True))
            )
        return qs

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, slug=None):
        """Получить все опубликованные посты по тегу (slug)."""
        tag = self.get_object()
        posts = tag.posts.filter(is_published=True).order_by("-first_published_at")
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)


class RatingViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для создания рейтинга поста."""

    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.AllowAny]


class ShortLinkViewSet(viewsets.ReadOnlyModelViewSet):
    """API для коротких ссылок."""

    queryset = ShortLink.objects.all().order_by("id")
    serializer_class = ShortLinkSerializer
    permission_classes = [permissions.AllowAny]


class AnalyticsEventViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для событий аналитики (только создание)."""

    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.AllowAny]


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """API для сообщений обратной связи (только создание)."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


# --- API Архива --- #


class ArchiveYearSummaryView(APIView):
    """Возвращает сводку по годам: год и количество постов."""

    permission_classes = [permissions.AllowAny]  # Архив доступен всем

    def get(self, request, *args, **kwargs):
        # Группируем опубликованные посты по году, считаем количество
        summary = (
            Post.objects.filter(is_published=True)
            .annotate(year=TruncYear("first_published_at"))
            .values("year")
            .annotate(posts_count=Count("id"))
            .values("year", "posts_count")
            .order_by("-year")  # Сортируем по убыванию года
        )
        # Преобразуем год из datetime в integer
        for item in summary:
            if item["year"]:  # Проверка, что год не None
                item["year"] = item["year"].year
            else:
                # Обработка случая, если first_published_at = None
                item["year"] = 0
                item["posts_count"] = 0
        # Убираем записи с None/0 годом, если они появились
        summary = [item for item in summary if item["year"] != 0]

        serializer = YearArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveMonthSummaryView(APIView):
    """Возвращает сводку по месяцам для указанного года."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, year, *args, **kwargs):
        summary = (
            Post.objects.filter(is_published=True, first_published_at__year=year)
            .annotate(month=TruncMonth("first_published_at"))
            .values("month")
            .annotate(posts_count=Count("id"))
            .values("month", "posts_count")
            .order_by("month")
        )
        for item in summary:
            if item["month"]:
                item["month"] = item["month"].month
            else:
                item["month"] = 0
                item["posts_count"] = 0
        summary = [item for item in summary if item["month"] != 0]
        serializer = MonthArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveDaySummaryView(APIView):
    """Возвращает сводку по дням для указанного года и месяца."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, year, month, *args, **kwargs):
        summary = (
            Post.objects.filter(
                is_published=True,
                first_published_at__year=year,
                first_published_at__month=month,
            )
            .annotate(day=TruncDay("first_published_at"))
            .values("day")
            .annotate(posts_count=Count("id"))
            .values("day", "posts_count")
            .order_by("day")
        )
        for item in summary:
            if item["day"]:
                item["day"] = item["day"].day
            else:
                item["day"] = 0
                item["posts_count"] = 0
        summary = [item for item in summary if item["day"] != 0]
        serializer = DayArchiveSerializer(summary, many=True)
        return Response(serializer.data)


class ArchiveDayPostsView(ListAPIView):
    """Возвращает пагинированный список постов за указанный день."""

    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    # Пагинация будет использоваться из глобальных настроек REST_FRAMEWORK

    def get_queryset(self):
        year = self.kwargs.get("year")
        month = self.kwargs.get("month")
        day = self.kwargs.get("day")

        if not all([year, month, day]):
            logger.warning(
                f"[Archive Log] Missing date components: year={year}, month={month}, day={day}"
            )
            return Post.objects.none()

        try:
            target_date = datetime.date(year, month, day)
            logger.info(
                f"[Archive Log] Attempting to fetch posts for date: {target_date}"
            )

            queryset = Post.objects.filter(
                is_published=True, first_published_at__date=target_date
            ).order_by("-first_published_at")

            logger.info(
                f"[Archive Log] Found {queryset.count()} posts for date {target_date} before pagination."
            )

            return queryset
        except ValueError:
            logger.warning(
                f"[Archive Log] ValueError: Invalid date components: year={year}, month={month}, day={day}"
            )
            return Post.objects.none()
        except Exception as e:
            # import traceback # traceback можно убрать, если логгируем исключение полностью
            logger.error(
                f"[Archive Log] Unexpected error in get_queryset for {year}-{month}-{day}: {type(e).__name__} - {str(e)}",
                exc_info=True,
            )
            # traceback.print_exc() # Заменено на exc_info=True в логгере
            raise


# Наш view-обертка, который теперь будет выполнять конвертацию
def custom_ckeditor_upload_file_view(request):
    # Права доступа и @require_POST проверяются внутри ckeditor_original_upload_file
    # Мы могли бы переопределить или добавить свою проверку здесь, если нужно

    if request.method == "POST":
        uploaded_file = request.FILES.get("upload")
        if not uploaded_file:
            logger.error("[Custom CKEditor Upload] No file uploaded.")
            # Возвращаем ошибку при неправильном методе
        return JsonResponse({"error": {"message": "No file uploaded."}}, status=400)

        logger.info(
            f"[Custom CKEditor Upload] Received original file: {uploaded_file.name}, type: {uploaded_file.content_type}, size: {uploaded_file.size}"
        )

        # --- Логика конвертации в WEBP на сервере ---
        original_filename_base = os.path.splitext(uploaded_file.name)[0]
        new_webp_filename = f"{original_filename_base}.webp"

        try:
            # Открываем изображение с помощью Pillow
            pil_img = PilImage.open(uploaded_file)

            # Конвертируем в WEBP (если это еще не WEBP)
            if pil_img.format != "WEBP":
                output_io = BytesIO()
                # Настройки качества/метода можно вынести в settings.py
                pil_img.save(
                    output_io, format="WEBP", quality=80, method=4, lossless=False
                )
                output_io.seek(0)
                webp_content_file = ContentFile(
                    output_io.read(), name=new_webp_filename
                )
                logger.info(
                    f"[Custom CKEditor Upload] Converted {uploaded_file.name} to WEBP."
                )
            else:
                # Если уже WEBP, просто используем его
                # Важно пересохранить через ContentFile, чтобы Django корректно обработал
                uploaded_file.seek(0)
                webp_content_file = ContentFile(
                    uploaded_file.read(), name=uploaded_file.name
                )  # Имя файла уже .webp
                logger.info(
                    f"[Custom CKEditor Upload] File {uploaded_file.name} is already WEBP."
                )

            # Подменяем файл в request.FILES для оригинального обработчика
            # Это не самый чистый способ, но позволяет переиспользовать логику сохранения файла
            # из django-ckeditor-5 без её полного копирования.
            # Создаем копию request.FILES, чтобы не изменять оригинал напрямую (если он нужен где-то еще)
            request_files_copy = request.FILES.copy()
            request_files_copy["upload"] = webp_content_file

            # Создаем "фальшивый" request с подмененными файлами для передачи в оригинальный view
            # Мы не можем просто изменить request.FILES напрямую, т.к. QueryDict иммутабелен
            # Вместо этого, мы передадим только файлы в form, который создается внутри upload_file

            # !!! Альтернатива: Не вызывать оригинальный view, а сохранить файл самим
            # и вернуть JSON. Это чище, чем пытаться подменить request.FILES.
            # Давайте сделаем так:

            from django_ckeditor_5.storage_utils import handle_uploaded_file

            # handle_uploaded_file ожидает объект UploadedFile
            # webp_content_file - это ContentFile, но он должен подойти, т.к. у него есть .name и .read()
            # handle_uploaded_file сохранит файл и вернет URL
            saved_url = handle_uploaded_file(webp_content_file)
            logger.info(f"[Custom CKEditor Upload] Saved WEBP file. URL: {saved_url}")
            return JsonResponse(
                {"url": saved_url}, status=200
            )  # Успешный ответ для CKEditor

        except Exception as e:
            logger.exception(
                f"[Custom CKEditor Upload] Error converting or saving WEBP for {uploaded_file.name}: {str(e)}"
            )
            # Уточняем ошибку для пользователя
            error_message = f"Ошибка обработки изображения: {str(e)}"
            if isinstance(e, IOError):
                error_message = "Не удалось прочитать или обработать файл изображения. Возможно, он поврежден или имеет неподдерживаемый формат."
            return JsonResponse(
                {"error": {"message": error_message}}, status=400
            )  # 400 или 500 в зависимости от ошибки

    else:
        # Если метод не POST (хотя @require_POST должен это предотвратить в оригинальном view)
        return JsonResponse({"error": {"message": "Метод не разрешен."}}, status=405)


# --- Новый View для загрузки изображений ---


class ImageUploadView(APIView):
    """
    Принимает POST запрос с файлом изображения ('upload'),
    (предполагается, что это уже WEBP, т.к. конвертация на фронте)
    сохраняет его в MEDIA_ROOT/posts/uploads/
    и возвращает относительный URL сохраненного файла.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.info("[ImageUploadView] Received POST request for image upload.")

        # --- ОТЛАДКА: Проверка MEDIA_ROOT и целевой папки ---
        media_root_path = str(settings.MEDIA_ROOT)  # Явное преобразование в строку
        target_dir_name = "posts/uploads"
        full_target_dir = os.path.join(media_root_path, target_dir_name)

        logger.info(f"[ImageUploadView DEBUG] settings.MEDIA_ROOT: {media_root_path}")
        logger.info(
            f"[ImageUploadView DEBUG] Target directory for uploads: {target_dir_name}"
        )
        logger.info(
            f"[ImageUploadView DEBUG] Full calculated target directory: {full_target_dir}"
        )

        if not os.path.exists(full_target_dir):
            logger.warning(
                f"[ImageUploadView DEBUG] Target directory {full_target_dir} DOES NOT EXIST!"
            )
            # Попытка создать директорию, если ее нет (хотя default_storage.save должен это делать)
            try:
                os.makedirs(full_target_dir, exist_ok=True)
                logger.info(
                    f"[ImageUploadView DEBUG] Successfully created directory: {full_target_dir}"
                )
            except Exception as e_mkdir:
                logger.error(
                    f"[ImageUploadView DEBUG] Failed to create directory {full_target_dir}: {e_mkdir}"
                )
        else:
            logger.info(
                f"[ImageUploadView DEBUG] Target directory {full_target_dir} exists."
            )
        # --- КОНЕЦ ОТЛАДКИ ---

        uploaded_file = request.FILES.get("upload")
        if not uploaded_file:
            logger.warning("[ImageUploadView] No file found in request.FILES['upload']")
            return Response(
                {"error": "Файл не найден в запросе."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Проверка типа файла (ожидаем WEBP)
        if uploaded_file.content_type != "image/webp":
            logger.warning(
                f"[ImageUploadView] Invalid file type: {uploaded_file.content_type}. Expected image/webp."
            )
            # Можно вернуть ошибку или попытаться конвертировать на бэке, но мы договорились о конвертации на фронте
            # return Response({"error": "Неверный тип файла. Ожидается WEBP."}, status=status.HTTP_400_BAD_REQUEST)
            pass  # Пока пропускаем, если фронт гарантирует WEBP

        # Генерируем уникальное имя файла, сохраняя расширение .webp
        original_name_without_ext, _ = os.path.splitext(uploaded_file.name)
        safe_original_name = slugify(
            original_name_without_ext
        )  # Очищаем имя от спецсимволов
        unique_id = uuid.uuid4().hex[:8]  # Короткий уникальный ID
        # Собираем имя файла: очищенное_имя-уникальный_id.webp
        # Пример: my-image-file-a1b2c3d4.webp
        filename = f"{safe_original_name}-{unique_id}.webp"

        # Путь для сохранения относительно MEDIA_ROOT
        # Модель Post ожидает путь типа "posts/uploads/filename.webp"
        # Поэтому здесь мы указываем только имя файла, так как default_storage.save
        # будет использовать location="posts/uploads/" при вызове.
        # Однако, для большей ясности и если default_storage настроен по-другому,
        # можно явно указать полный относительный путь.

        # Путь внутри MEDIA_ROOT, куда будет сохранен файл
        # Используем target_dir_name, определенный ранее
        save_path_within_media_root = os.path.join(target_dir_name, filename)
        # Убедимся, что нет обратных слешей, если работаем на Windows
        save_path_within_media_root = save_path_within_media_root.replace("\\", "/")

        logger.info(
            f"[ImageUploadView] Attempting to save file as: {save_path_within_media_root} within MEDIA_ROOT."
        )

        try:
            # Сохраняем файл, default_storage.save возвращает имя сохраненного файла (может отличаться, если имя уже занято)
            saved_file_name_from_storage = default_storage.save(
                save_path_within_media_root, uploaded_file
            )
            logger.info(
                f"[ImageUploadView] File successfully saved by storage. Returned name: {saved_file_name_from_storage}"
            )

            # Путь, который мы должны вернуть клиенту и который будет сохранен в модели Post
            # Это должен быть путь относительно MEDIA_ROOT
            path_for_model_and_client = saved_file_name_from_storage
            # Убедимся, что это корректный относительный путь без начального MEDIA_ROOT
            if path_for_model_and_client.startswith(media_root_path):
                logger.warning(
                    f"[ImageUploadView] saved_file_name_from_storage '{path_for_model_and_client}' seems to include MEDIA_ROOT. Stripping it."
                )
                path_for_model_and_client = os.path.relpath(
                    path_for_model_and_client, media_root_path
                )
                path_for_model_and_client = path_for_model_and_client.replace("\\", "/")

            logger.info(
                f"[ImageUploadView] Returning path for model field and client: {path_for_model_and_client}"
            )
            return Response(
                {"url": path_for_model_and_client}, status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"[ImageUploadView] Error saving file: {e}", exc_info=True)
            return Response(
                {"error": "Ошибка при сохранении файла на сервере.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ShortLinkRedirectView(View):
    """Редирект по короткой ссылке на пост."""

    def get(self, request, code):
        try:
            shortlink = ShortLink.objects.get(code=code)
            return HttpResponseRedirect(shortlink.get_redirect_url())
        except ShortLink.DoesNotExist:
            raise Http404("Короткая ссылка не найдена")
