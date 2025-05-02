from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Кастомный обработчик ошибок DRF. Возвращает ошибки в формате:
    {
        "error": <тип ошибки>,
        "message": <описание>
    }
    """
    response = exception_handler(exc, context)
    if response is not None:
        error_type = exc.__class__.__name__
        message = (
            response.data.get("detail") if "detail" in response.data else response.data
        )
        response.data = {"error": error_type, "message": message}
    else:
        # Необработанные ошибки
        return Response(
            {"error": "Validation error", "message": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return response
