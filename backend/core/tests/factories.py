import factory
from core.models import SiteSettings


class SiteSettingsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SiteSettings

    title = "Blog"
    tagline = "Tagline"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        obj = model_class.load()
        for key, value in kwargs.items():
            setattr(obj, key, value)
        obj.save()
        return obj
