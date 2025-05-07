from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
from .models import RobotsRule, GlobalSEOSettings
import logging

logger = logging.getLogger(__name__)

# Create your views here.

def robots_txt_view(request):
    """Генерирует содержимое файла robots.txt на основе правил из БД."""
    lines = []
    rules = RobotsRule.objects.all().order_by('user_agent', 'directive', 'path')
    settings_instance = GlobalSEOSettings.objects.first() # Предполагаем Singleton

    # Группируем правила по User-agent
    rules_by_ua = {}
    for rule in rules:
        if rule.user_agent not in rules_by_ua:
            rules_by_ua[rule.user_agent] = []
        rules_by_ua[rule.user_agent].append(f"{rule.directive}: {rule.path}")

    # Добавляем блок для '*', если его нет
    if "*" not in rules_by_ua:
        lines.append("User-agent: *")
        lines.append("Disallow: /admin/") # Пример: разумное правило по умолчанию
        lines.append("")

    # Формируем строки для каждого User-agent
    for ua, directives in rules_by_ua.items():
        lines.append(f"User-agent: {ua}")
        lines.extend(directives)
        # Добавляем Crawl-delay, если задан в настройках
        if settings_instance and settings_instance.robots_crawl_delay:
            lines.append(f"Crawl-delay: {settings_instance.robots_crawl_delay}")
        lines.append("") # Пустая строка между блоками

    # Добавляем ссылку на Sitemap
    # Определяем базовый URL (предпочтительно из настроек или переменных окружения)
    # Для примера используем FRONTEND_URL, но это может быть и URL самого бэкенда,
    # если sitemap.xml отдается Django.
    base_url = getattr(settings, 'FRONTEND_URL', f"{request.scheme}://{request.get_host()}")
    # Убираем конечный слеш, если он есть, перед добавлением /sitemap.xml
    base_url = base_url.rstrip('/')
    sitemap_url = f"{base_url}/sitemap.xml"
    lines.append(f"Sitemap: {sitemap_url}")

    content = "\n".join(lines)
    return HttpResponse(content, content_type="text/plain")
