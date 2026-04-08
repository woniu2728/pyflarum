"""
User API endpoints
"""
from ninja import Router
from ninja.security import HttpBearer
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from typing import List

from .models import User
from .schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    TokenSchema,
    UserOutSchema,
    UserDetailSchema,
    UserUpdateSchema,
    PasswordChangeSchema,
    PasswordResetRequestSchema,
    PasswordResetSchema,
    EmailVerifySchema,
)
from .services import UserService

router = Router()


class AuthBearer(HttpBearer):
    """JWT认证"""
    def authenticate(self, request, token):
        try:
            from ninja_jwt.authentication import JWTAuth
            jwt_auth = JWTAuth()
            return jwt_auth.authenticate(request, token)
        except Exception:
            return None


# ==================== 认证相关 ====================

@router.post("/register", response=UserOutSchema, tags=["Auth"])
def register(request, payload: UserRegisterSchema):
    """用户注册"""
    try:
        user = UserService.create_user(
            username=payload.username,
            email=payload.email,
            password=payload.password,
        )
        return user
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


@router.post("/login", response=TokenSchema, tags=["Auth"])
def login(request, payload: UserLoginSchema):
    """用户登录"""
    try:
        user = UserService.authenticate_user(
            identification=payload.identification,
            password=payload.password,
        )

        # 生成JWT Token
        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=401,
        )


@router.post("/logout", auth=AuthBearer(), tags=["Auth"])
def logout(request):
    """用户登出"""
    # JWT是无状态的，客户端删除token即可
    return {"message": "登出成功"}


@router.post("/verify-email", response=UserOutSchema, tags=["Auth"])
def verify_email(request, payload: EmailVerifySchema):
    """验证邮箱"""
    try:
        user = UserService.verify_email(payload.token)
        return user
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


@router.post("/forgot-password", tags=["Auth"])
def forgot_password(request, payload: PasswordResetRequestSchema):
    """请求重置密码"""
    try:
        UserService.create_password_reset_token(payload.email)
        return {"message": "重置密码邮件已发送"}
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


@router.post("/reset-password", response=UserOutSchema, tags=["Auth"])
def reset_password(request, payload: PasswordResetSchema):
    """重置密码"""
    try:
        user = UserService.reset_password(payload.token, payload.password)
        return user
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


# ==================== 用户信息 ====================

@router.get("/me", response=UserDetailSchema, auth=AuthBearer(), tags=["Users"])
def get_current_user(request):
    """获取当前用户信息"""
    return request.auth


@router.get("", response=List[UserOutSchema], tags=["Users"])
def list_users(request, page: int = 1, limit: int = 20, q: str = None):
    """获取用户列表"""
    queryset = User.objects.all()

    # 搜索
    if q:
        queryset = queryset.filter(username__icontains=q) | queryset.filter(display_name__icontains=q)

    # 分页
    start = (page - 1) * limit
    end = start + limit

    return list(queryset[start:end])


@router.get("/{user_id}", response=UserDetailSchema, tags=["Users"])
def get_user(request, user_id: int):
    """获取用户详情"""
    user = get_object_or_404(User, id=user_id)
    return user


@router.patch("/{user_id}", response=UserOutSchema, auth=AuthBearer(), tags=["Users"])
def update_user(request, user_id: int, payload: UserUpdateSchema):
    """更新用户信息"""
    user = get_object_or_404(User, id=user_id)

    # 检查权限：只能修改自己的信息
    if request.auth.id != user.id and not request.auth.is_staff:
        return router.create_response(
            request,
            {"error": "无权限"},
            status=403,
        )

    try:
        user = UserService.update_user(
            user,
            display_name=payload.display_name,
            bio=payload.bio,
            email=payload.email,
        )
        return user
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


@router.post("/{user_id}/password", auth=AuthBearer(), tags=["Users"])
def change_password(request, user_id: int, payload: PasswordChangeSchema):
    """修改密码"""
    user = get_object_or_404(User, id=user_id)

    # 检查权限：只能修改自己的密码
    if request.auth.id != user.id:
        return router.create_response(
            request,
            {"error": "无权限"},
            status=403,
        )

    try:
        UserService.change_password(user, payload.old_password, payload.new_password)
        return {"message": "密码修改成功"}
    except ValueError as e:
        return router.create_response(
            request,
            {"error": str(e)},
            status=400,
        )


@router.post("/{user_id}/avatar", auth=AuthBearer(), tags=["Users"])
def upload_avatar(request, user_id: int):
    """上传头像"""
    user = get_object_or_404(User, id=user_id)

    # 检查权限
    if request.auth.id != user.id:
        return router.create_response(
            request,
            {"error": "无权限"},
            status=403,
        )

    # TODO: 实现文件上传逻辑
    return {"message": "头像上传功能待实现"}
