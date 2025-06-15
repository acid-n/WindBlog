from django.contrib import admin

from .models import Post, Rating, ShortLink, Tag


class ShortLinkInline(admin.TabularInline):
    model = ShortLink
    extra = 0
    readonly_fields = ("code", "id")
    can_delete = False
    max_num = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Админка для постов блога."""

    list_display = (
        "title",
        "slug",
        "is_published",
        "first_published_at",
        "created_at",
        "updated_at",
        "sitemap_include",
    )
    list_filter = ("is_published", "tags", "first_published_at")
    search_fields = ("title", "description", "body_text_for_search")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("tags",)
    readonly_fields = ("created_at", "updated_at", "body_text_for_search")

    fieldsets = (
        (None, {"fields": ("title", "slug")}),
        ("Статус и Дата", {"fields": ("is_published", "first_published_at")}),
        ("Контент", {"fields": ("image", "description", "body", "tags")}),
        (
            "SEO и Sitemap",
            {
                "classes": ("collapse",),
                "fields": ("sitemap_include", "sitemap_priority", "sitemap_changefreq"),
            },
        ),
        (
            "Служебная информация",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at", "body_text_for_search"),
            },
        ),
    )

    inlines = [ShortLinkInline]

    # Подключаем наш кастомный JS для инициализации Tiptap
    # class Media:
    #     js = ('blog/js/admin_tiptap_init.js',)
    #     # Возможно, позже понадобится CSS для контейнера редактора
    #     # css = {
    #     #     'all': ('blog/css/admin_tiptap_styles.css',)
    #     # }


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Админка для тегов."""

    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("post_title", "score", "user_hash", "created_at")
    list_filter = ("score", "created_at")
    search_fields = ("post__title", "user_hash")
    readonly_fields = ("created_at",)

    def post_title(self, obj):
        return obj.post.title

    post_title.short_description = "Пост"
    post_title.admin_order_field = "post__title"


@admin.register(ShortLink)
class ShortLinkAdmin(admin.ModelAdmin):
    list_display = ("post_title", "code", "get_redirect_url")
    readonly_fields = ("code",)
    search_fields = ("post__title", "code")

    def post_title(self, obj):
        return obj.post.title

    post_title.short_description = "Пост"


