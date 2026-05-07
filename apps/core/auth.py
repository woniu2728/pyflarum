from apps.core.jwt_auth import AccessTokenAuth


AuthBearer = AccessTokenAuth


def get_optional_user(request):
    if getattr(request, "auth", None) and request.auth.is_authenticated:
        return request.auth

    if getattr(request, "user", None) and request.user.is_authenticated:
        return request.user

    user = AccessTokenAuth()(request)
    if user and user.is_authenticated:
        return user

    return None
