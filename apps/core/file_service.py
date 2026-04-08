"""
文件上传功能业务逻辑层
"""
import os
import uuid
from typing import Optional, Tuple
from django.core.files.uploadedfile import UploadedFile
from django.conf import settings
from PIL import Image
import hashlib


class FileUploadService:
    """文件上传服务"""

    # 允许的图片格式
    ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    # 允许的附件格式
    ALLOWED_ATTACHMENT_EXTENSIONS = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',  # 图片
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',  # 文档
        '.txt', '.md', '.csv',  # 文本
        '.zip', '.rar', '.7z',  # 压缩包
    ]

    # 文件大小限制（字节）
    MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB
    MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024  # 10MB

    # 头像尺寸
    AVATAR_SIZES = {
        'small': (50, 50),
        'medium': (100, 100),
        'large': (200, 200),
    }

    @staticmethod
    def upload_avatar(file: UploadedFile, user_id: int) -> Tuple[str, dict]:
        """
        上传头像

        Args:
            file: 上传的文件
            user_id: 用户ID

        Returns:
            Tuple[str, dict]: (文件URL, 缩略图URLs)

        Raises:
            ValueError: 文件验证失败
        """
        # 验证文件
        FileUploadService._validate_image(file, FileUploadService.MAX_AVATAR_SIZE)

        # 生成文件名
        ext = os.path.splitext(file.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"

        # 保存路径
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'avatars', str(user_id))
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, filename)

        # 保存原图
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # 生成缩略图
        thumbnails = FileUploadService._generate_thumbnails(
            file_path,
            FileUploadService.AVATAR_SIZES
        )

        # 返回URL
        file_url = f"/media/avatars/{user_id}/{filename}"
        thumbnail_urls = {
            size: f"/media/avatars/{user_id}/{os.path.basename(thumb_path)}"
            for size, thumb_path in thumbnails.items()
        }

        return file_url, thumbnail_urls

    @staticmethod
    def upload_attachment(file: UploadedFile, user_id: int) -> Tuple[str, dict]:
        """
        上传附件

        Args:
            file: 上传的文件
            user_id: 用户ID

        Returns:
            Tuple[str, dict]: (文件URL, 文件信息)

        Raises:
            ValueError: 文件验证失败
        """
        # 验证文件
        FileUploadService._validate_attachment(file, FileUploadService.MAX_ATTACHMENT_SIZE)

        # 生成文件名
        ext = os.path.splitext(file.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"

        # 保存路径
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'attachments', str(user_id))
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, filename)

        # 保存文件
        with open(file_path, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        # 计算文件哈希
        file_hash = FileUploadService._calculate_file_hash(file_path)

        # 文件信息
        file_info = {
            'original_name': file.name,
            'size': file.size,
            'mime_type': file.content_type,
            'hash': file_hash,
        }

        # 返回URL
        file_url = f"/media/attachments/{user_id}/{filename}"

        return file_url, file_info

    @staticmethod
    def _validate_image(file: UploadedFile, max_size: int):
        """
        验证图片文件

        Args:
            file: 上传的文件
            max_size: 最大文件大小

        Raises:
            ValueError: 验证失败
        """
        # 检查文件扩展名
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in FileUploadService.ALLOWED_IMAGE_EXTENSIONS:
            raise ValueError(f"不支持的图片格式，仅支持: {', '.join(FileUploadService.ALLOWED_IMAGE_EXTENSIONS)}")

        # 检查文件大小
        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValueError(f"文件大小超过限制（最大{max_size_mb}MB）")

        # 验证是否为有效图片
        try:
            image = Image.open(file)
            image.verify()
        except Exception:
            raise ValueError("无效的图片文件")

    @staticmethod
    def _validate_attachment(file: UploadedFile, max_size: int):
        """
        验证附件文件

        Args:
            file: 上传的文件
            max_size: 最大文件大小

        Raises:
            ValueError: 验证失败
        """
        # 检查文件扩展名
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in FileUploadService.ALLOWED_ATTACHMENT_EXTENSIONS:
            raise ValueError(f"不支持的文件格式")

        # 检查文件大小
        if file.size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            raise ValueError(f"文件大小超过限制（最大{max_size_mb}MB）")

    @staticmethod
    def _generate_thumbnails(image_path: str, sizes: dict) -> dict:
        """
        生成缩略图

        Args:
            image_path: 原图路径
            sizes: 尺寸字典 {name: (width, height)}

        Returns:
            dict: 缩略图路径字典 {name: path}
        """
        thumbnails = {}

        try:
            image = Image.open(image_path)

            # 转换RGBA为RGB
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background

            for size_name, (width, height) in sizes.items():
                # 创建缩略图
                thumb = image.copy()
                thumb.thumbnail((width, height), Image.Resampling.LANCZOS)

                # 保存缩略图
                base_path = os.path.splitext(image_path)[0]
                ext = os.path.splitext(image_path)[1]
                thumb_path = f"{base_path}_{size_name}{ext}"

                thumb.save(thumb_path, quality=85, optimize=True)
                thumbnails[size_name] = thumb_path

        except Exception as e:
            # 如果生成缩略图失败，返回空字典
            pass

        return thumbnails

    @staticmethod
    def _calculate_file_hash(file_path: str) -> str:
        """
        计算文件哈希值

        Args:
            file_path: 文件路径

        Returns:
            str: SHA256哈希值
        """
        sha256_hash = hashlib.sha256()

        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        return sha256_hash.hexdigest()

    @staticmethod
    def delete_file(file_url: str) -> bool:
        """
        删除文件

        Args:
            file_url: 文件URL

        Returns:
            bool: 是否删除成功
        """
        try:
            # 从URL提取文件路径
            if file_url.startswith('/media/'):
                file_path = os.path.join(settings.MEDIA_ROOT, file_url[7:])

                if os.path.exists(file_path):
                    os.remove(file_path)

                    # 删除缩略图
                    base_path = os.path.splitext(file_path)[0]
                    ext = os.path.splitext(file_path)[1]

                    for size_name in FileUploadService.AVATAR_SIZES.keys():
                        thumb_path = f"{base_path}_{size_name}{ext}"
                        if os.path.exists(thumb_path):
                            os.remove(thumb_path)

                    return True
        except Exception:
            pass

        return False
