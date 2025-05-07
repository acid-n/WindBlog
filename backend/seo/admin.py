from django.contrib import admin
from .models import RobotsRule, GlobalSEOSettings #, OtherSEOModel if exists
# Если используете django-solo для GlobalSEOSettings:
# from solo.admin import SingletonModelAdmin

@admin.register(RobotsRule)
class RobotsRuleAdmin(admin.ModelAdmin):
    list_display = ('user_agent', 'directive', 'path')
    list_filter = ('directive', 'user_agent')
    search_fields = ('path', 'user_agent')
    # Если добавили поле order:
    # list_editable = ('order',)
    # ordering = ('order', 'user_agent', 'directive')

# Раскомментируйте и настройте, если создали модель GlobalSEOSettings
@admin.register(GlobalSEOSettings)
class GlobalSEOSettingsAdmin(admin.ModelAdmin): # Замените на SingletonModelAdmin, если используется django-solo
    # pass # Настройте отображение полей, если необходимо
    fieldsets = (
        ('Верификация сайта', {
            'fields': ('site_verification_google', 'site_verification_yandex')
        }),
        ('Настройки robots.txt', {
            'fields': ('robots_crawl_delay',)
        }),
        ('Настройки Sitemap по умолчанию', {
            'fields': ('default_sitemap_priority', 'default_sitemap_changefreq')
        }),
    )
