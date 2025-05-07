from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsEventViewSet,
    ArchiveDayPostsView,
    ArchiveDaySummaryView,
    ArchiveMonthSummaryView,
    ArchiveYearSummaryView,
    ContactMessageViewSet,
    PostViewSet,
    RatingViewSet,
    ShortLinkViewSet,
    TagViewSet,
)

router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"ratings", RatingViewSet, basename="rating")
router.register(r"shortlinks", ShortLinkViewSet, basename="shortlink")
router.register(r"analytics", AnalyticsEventViewSet, basename="analytics")
router.register(r"contact", ContactMessageViewSet, basename="contact")

# Добавляем URL-ы для архива отдельно, так как они не вписываются в стандартный ViewSet
archive_urlpatterns = [
    path("archive/summary/", ArchiveYearSummaryView.as_view(), name="archive-year-summary"),
    path("archive/<int:year>/summary/", ArchiveMonthSummaryView.as_view(), name="archive-month-summary"),
    path("archive/<int:year>/<int:month>/summary/", ArchiveDaySummaryView.as_view(), name="archive-day-summary"),
    path("archive/<int:year>/<int:month>/<int:day>/", ArchiveDayPostsView.as_view(), name="archive-day-posts"),
]

urlpatterns = router.urls + archive_urlpatterns
