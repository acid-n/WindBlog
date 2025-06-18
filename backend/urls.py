from core.api import SiteSettingsViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("site-settings", SiteSettingsViewSet, basename="site-settings")

urlpatterns = router.urls
