from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ArchiveDayPostsView,
    ArchiveDaySummaryView,
    ArchiveMonthSummaryView,
    ArchiveYearSummaryView,
    ImageUploadView,
    PostViewSet,
    RatingViewSet,
    ShortLinkRedirectView,
    ShortLinkViewSet,
    TagViewSet,
)

app_name = "blog_api"

router = DefaultRouter()
router.register("posts", PostViewSet, basename="post")
router.register("tags", TagViewSet, basename="tag")
router.register("ratings", RatingViewSet, basename="rating")
router.register("shortlinks", ShortLinkViewSet, basename="shortlink")

# Добавляем URL-ы для архива отдельно, так как они не вписываются в стандартный ViewSet
archive_urlpatterns = [
    path(
        "archive/summary/",
        ArchiveYearSummaryView.as_view(),
        name="archive-year-summary",
    ),
    path(
        "archive/<int:year>/summary/",
        ArchiveMonthSummaryView.as_view(),
        name="archive-month-summary",
    ),
    path(
        "archive/<int:year>/<int:month>/summary/",
        ArchiveDaySummaryView.as_view(),
        name="archive-day-summary",
    ),
    path(
        "archive/<int:year>/<int:month>/<int:day>/",
        ArchiveDayPostsView.as_view(),
        name="archive-day-posts",
    ),
]

urlpatterns = (
    router.urls
    + archive_urlpatterns
    + [
        path("image-upload/", ImageUploadView.as_view(), name="image-upload"),
        path(
            "api/v1/shortlinks/<str:code>/",
            ShortLinkRedirectView.as_view(),
            name="shortlink-redirect",
        ),
    ]
)
