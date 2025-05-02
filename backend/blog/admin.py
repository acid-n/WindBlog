from django.contrib import admin

from .models import AnalyticsEvent, ContactMessage, Post, Rating, ShortLink, Tag


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Админка для постов блога."""

    list_display = ("title", "is_published", "first_published_at")
    list_filter = ("is_published", "first_published_at", "tags")
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("tags",)
    date_hierarchy = "first_published_at"


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Админка для тегов."""

    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("post", "score", "user_hash", "created_at")
    list_filter = ("score", "created_at")
    search_fields = ("post__title", "user_hash")


@admin.register(ShortLink)
class ShortLinkAdmin(admin.ModelAdmin):
    list_display = ("post", "code")
    search_fields = ("code", "post__title")


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("path", "ip", "created_at")
    search_fields = ("path", "ip", "user_agent")
    list_filter = ("created_at",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email", "message")
    list_filter = ("created_at",)
