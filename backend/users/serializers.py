from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Добавляем кастомные поля в токен
        token["email"] = user.email
        token["username"] = (
            user.username if hasattr(user, "username") and user.username else user.email
        )  # Если username нет, дублируем email или оставляем пустым
        # Вы можете добавить любые другие поля пользователя, которые хотите иметь в токене
        # token['first_name'] = user.first_name
        # token['is_staff'] = user.is_staff

        return token


# Если вам также нужно кастомизировать RefreshTokenSerializer, это делается аналогично.
# Например, если бы мы хотели добавить что-то при обновлении токена.
# class MyTokenRefreshSerializer(TokenRefreshSerializer):
#     def validate(self, attrs):
#         data = super().validate(attrs)
#         # Тут можно было бы добавить кастомные данные в ответ при обновлении токена,
#         # но обычно это не требуется для access токена.
#         return data
