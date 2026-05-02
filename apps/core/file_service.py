"""
文件上传功能业务逻辑层
"""
import hashlib
import os
import uuid
from io import BytesIO
from typing import Tuple

from django.core.files.uploadedfile import UploadedFile
from PIL import Image

from apps.core.settings_service import ADVANCED_SETTINGS_DEFAULTS, get_setting_group
from apps.core.storage_service import get_storage_backend


class FileUploadService:
    """文件上传服务"""

    ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    ALLOWED_LOGO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    ALLOWED_FAVICON_EXTENSIONS = ['.ico', '.png', '.svg', '.webp']

    ALLOWED_ATTACHMENT_EXTENSIONS = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.txt', '.md', '.csv',
        '.zip', '.rar', '.7z',
    ]

    MAX_AVATAR_SIZE = 2 * 1024 * 1024
    MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
    MAX_SITE_ASSET_SIZE = 2 * 1024 * 1024
    MIN_UPLOAD_SIZE_MB = 1
    MAX_UPLOAD_SIZE_MB = 100

    AVATAR_SIZES = {
        'small': (50, 50),
        'medium': (100, 100),
        'large': (200, 200),
    }

    @staticmethod
    def upload_avatar(file: UploadedFile, user_id: int) -> Tuple[str, dict]:
        FileUploadService._validate_image(file, FileUploadService.get_upload_limit_bytes("avatar"))

        ext = os.path.splitext(file.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        backend = get_storage_backend()

        original_bytes = FileUploadService._read_uploaded_file(file)
        original_key = backend.build_user_key(backend.avatars_dir, user_id, filename)
        original_url = backend.save_bytes(
            original_key,
            original_bytes,
            content_type=backend.guess_content_type(filename, file.content_type),
        )

        thumbnails = FileUploadService._generate_thumbnail_bytes(original_bytes, ext)
        thumbnail_urls = {}
        for size_name, thumb_bytes in thumbnails.items():
            thumb_filename = f"{os.path.splitext(filename)[0]}_{size_name}{ext}"
            thumb_key = backend.build_user_key(backend.avatars_dir, user_id, thumb_filename)
            thumbnail_urls[size_name] = backend.save_bytes(
                thumb_key,
                thumb_bytes,
                content_type=backend.guess_content_type(thumb_filename, file.content_type),
            )

        return original_url, thumbnail_urls

    @staticmethod
    def upload_attachment(file: UploadedFile, user_id: int) -> Tuple[str, dict]:
        FileUploadService._validate_attachment(file, FileUploadService.get_upload_limit_bytes("attachment"))

        ext = os.path.splitext(file.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        backend = get_storage_backend()
        content = FileUploadService._read_uploaded_file(file)
        object_key = backend.build_user_key(backend.attachments_dir, user_id, filename)
        file_url = backend.save_bytes(
            object_key,
            content,
            content_type=backend.guess_content_type(filename, file.content_type),
        )

        file_info = {
            'original_name': file.name,
            'size': file.size,
            'mime_type': file.content_type,
            'hash': FileUploadService._calculate_file_hash(content),
        }
        return file_url, file_info

    @staticmethod
    def upload_site_asset(file: UploadedFile, asset_type: str) -> Tuple[str, dict]:
        normalized_type = str(asset_type or "").strip().lower()
        ext = os.path.splitext(file.name)[1].lower()

        if normalized_type == "logo":
            allowed_extensions = FileUploadService.ALLOWED_LOGO_EXTENSIONS
        elif normalized_type == "favicon":
            allowed_extensions = FileUploadService.ALLOWED_FAVICON_EXTENSIONS
        else:
            raise ValueError("不支持的站点资源类型")

        FileUploadService._validate_site_asset(file, allowed_extensions, FileUploadService.get_upload_limit_bytes("site_asset"))

        filename = f"{uuid.uuid4().hex}{ext}"
        backend = get_storage_backend()
        content = FileUploadService._read_uploaded_file(file)
        object_key = backend.join_key("appearance", normalized_type, filename)
        file_url = backend.save_bytes(
            object_key,
            content,
            content_type=backend.guess_content_type(filename, file.content_type),
        )

        file_info = {
            'original_name': file.name,
            'size': file.size,
            'mime_type': file.content_type,
            'hash': FileUploadService._calculate_file_hash(content),
        }
        return file_url, file_info

    @staticmethod
    def _validate_image(file: UploadedFile, max_size: int):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in FileUploadService.ALLOWED_IMAGE_EXTENSIONS:
            raise ValueError(f"不支持的图片格式，仅支持: {', '.join(FileUploadService.ALLOWED_IMAGE_EXTENSIONS)}")

        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValueError(f"文件大小超过限制（最大{max_size_mb}MB）")

        try:
            image = Image.open(file)
            image.verify()
        except Exception as exc:
            raise ValueError("无效的图片文件") from exc
        finally:
            if hasattr(file, 'seek'):
                file.seek(0)

    @staticmethod
    def _validate_attachment(file: UploadedFile, max_size: int):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in FileUploadService.ALLOWED_ATTACHMENT_EXTENSIONS:
            raise ValueError("不支持的文件格式")

        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValueError(f"文件大小超过限制（最大{max_size_mb}MB）")

    @staticmethod
    def _validate_site_asset(file: UploadedFile, allowed_extensions, max_size: int):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in allowed_extensions:
            raise ValueError(f"不支持的文件格式，仅支持: {', '.join(allowed_extensions)}")

        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValueError(f"文件大小超过限制（最大{max_size_mb}MB）")

    @staticmethod
    def get_upload_policy() -> dict:
        settings_data = get_setting_group("advanced", ADVANCED_SETTINGS_DEFAULTS)
        return {
            "avatar_max_size_mb": FileUploadService._normalize_upload_size_mb(
                settings_data.get("upload_avatar_max_size_mb"),
                FileUploadService.MAX_AVATAR_SIZE,
            ),
            "attachment_max_size_mb": FileUploadService._normalize_upload_size_mb(
                settings_data.get("upload_attachment_max_size_mb"),
                FileUploadService.MAX_ATTACHMENT_SIZE,
            ),
            "site_asset_max_size_mb": FileUploadService._normalize_upload_size_mb(
                settings_data.get("upload_site_asset_max_size_mb"),
                FileUploadService.MAX_SITE_ASSET_SIZE,
            ),
            "allowed_image_extensions": FileUploadService.ALLOWED_IMAGE_EXTENSIONS,
            "allowed_logo_extensions": FileUploadService.ALLOWED_LOGO_EXTENSIONS,
            "allowed_favicon_extensions": FileUploadService.ALLOWED_FAVICON_EXTENSIONS,
            "allowed_attachment_extensions": FileUploadService.ALLOWED_ATTACHMENT_EXTENSIONS,
        }

    @staticmethod
    def get_upload_limit_bytes(kind: str) -> int:
        policy = FileUploadService.get_upload_policy()
        key_by_kind = {
            "avatar": "avatar_max_size_mb",
            "attachment": "attachment_max_size_mb",
            "site_asset": "site_asset_max_size_mb",
        }
        default_by_kind = {
            "avatar": FileUploadService.MAX_AVATAR_SIZE,
            "attachment": FileUploadService.MAX_ATTACHMENT_SIZE,
            "site_asset": FileUploadService.MAX_SITE_ASSET_SIZE,
        }
        key = key_by_kind.get(kind)
        if not key:
            return default_by_kind.get(kind, FileUploadService.MAX_ATTACHMENT_SIZE)
        return int(policy[key] * 1024 * 1024)

    @staticmethod
    def _normalize_upload_size_mb(value, default_bytes: int) -> int:
        default_mb = max(1, int(default_bytes / (1024 * 1024)))
        try:
            normalized = int(value)
        except (TypeError, ValueError):
            normalized = default_mb
        return min(FileUploadService.MAX_UPLOAD_SIZE_MB, max(FileUploadService.MIN_UPLOAD_SIZE_MB, normalized))

    @staticmethod
    def _generate_thumbnail_bytes(image_bytes: bytes, ext: str) -> dict:
        thumbnails = {}

        try:
            image = Image.open(BytesIO(image_bytes))
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            output_format = FileUploadService._image_output_format(ext)
            for size_name, (width, height) in FileUploadService.AVATAR_SIZES.items():
                thumb = image.copy()
                thumb.thumbnail((width, height), Image.Resampling.LANCZOS)

                buffer = BytesIO()
                save_kwargs = {'format': output_format}
                if output_format in ('JPEG', 'WEBP'):
                    save_kwargs.update({'quality': 85, 'optimize': True})
                thumb.save(buffer, **save_kwargs)
                thumbnails[size_name] = buffer.getvalue()
        except Exception:
            return {}

        return thumbnails

    @staticmethod
    def _image_output_format(ext: str) -> str:
        if ext in ('.jpg', '.jpeg'):
            return 'JPEG'
        if ext == '.webp':
            return 'WEBP'
        if ext == '.gif':
            return 'GIF'
        return 'PNG'

    @staticmethod
    def _read_uploaded_file(file: UploadedFile) -> bytes:
        if hasattr(file, 'seek'):
            file.seek(0)
        content = b''.join(file.chunks())
        if hasattr(file, 'seek'):
            file.seek(0)
        return content

    @staticmethod
    def _calculate_file_hash(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def delete_file(file_url: str) -> bool:
        backend = get_storage_backend()
        deleted = backend.delete(file_url)

        if FileUploadService._looks_like_avatar(file_url):
            base, ext = os.path.splitext(file_url)
            for size_name in FileUploadService.AVATAR_SIZES.keys():
                backend.delete(f"{base}_{size_name}{ext}")

        return deleted

    @staticmethod
    def _looks_like_avatar(file_url: str) -> bool:
        normalized = str(file_url or '').lower()
        return '/avatars/' in normalized or normalized.endswith('/avatars')
