"""
Сериализаторы для работы с архивом блога.

Этот модуль содержит сериализаторы для архива постов по годам, месяцам и дням.
"""

from rest_framework import serializers


class YearArchiveSerializer(serializers.Serializer):
    """
    Сериализатор для годовой сводки архива.
    
    Предоставляет информацию о годе и количестве постов в этом году.
    """

    year = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class MonthArchiveSerializer(serializers.Serializer):
    """
    Сериализатор для месячной сводки архива.
    
    Предоставляет информацию о месяце и количестве постов в этом месяце.
    """

    month = serializers.IntegerField()
    posts_count = serializers.IntegerField()


class DayArchiveSerializer(serializers.Serializer):
    """
    Сериализатор для дневной сводки архива.
    
    Предоставляет информацию о дне и количестве постов в этот день.
    """

    day = serializers.IntegerField()
    posts_count = serializers.IntegerField()
