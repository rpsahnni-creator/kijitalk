"""Every error leaves this service as {"error": "<message>", "fields"?: {...}},
which is the shape the KijiTalk apps already read."""

from rest_framework import exceptions
from rest_framework.views import exception_handler


def _first_message(detail) -> str:
    if isinstance(detail, dict):
        for value in detail.values():
            return _first_message(value)
    if isinstance(detail, (list, tuple)) and detail:
        return _first_message(detail[0])
    return str(detail)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, exceptions.Throttled):
        response.data = {"error": "Bahut zyada attempts — thodi der baad try karo."}
    elif isinstance(exc, exceptions.ValidationError):
        response.data = {"error": _first_message(exc.detail), "fields": exc.detail}
    elif isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        response.data = {"error": "Sign in karna zaroori hai."}
    else:
        response.data = {"error": _first_message(response.data)}
    return response
