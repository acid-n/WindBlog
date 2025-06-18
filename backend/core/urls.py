from rest_framework.routers import DefaultRouter

from .api import SiteSettingsViewSet

router = DefaultRouter()
router.register("site-settings", SiteSettingsViewSet, basename="site-settings")

urlpatterns = router.urls
