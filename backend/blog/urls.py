from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsEventViewSet,
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

urlpatterns = router.urls
