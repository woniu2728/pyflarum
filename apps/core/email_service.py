"""
邮件发送服务
"""
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """邮件发送服务"""

    @staticmethod
    def send_verification_email(user_email: str, username: str, token: str) -> bool:
        """
        发送邮箱验证邮件

        Args:
            user_email: 用户邮箱
            username: 用户名
            token: 验证令牌

        Returns:
            bool: 是否发送成功
        """
        subject = '验证您的邮箱 - PyFlarum'

        # 生成验证链接
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        # 纯文本内容
        text_content = f"""
        您好 {username}，

        感谢您注册PyFlarum！

        请点击以下链接验证您的邮箱：
        {verification_url}

        如果您没有注册PyFlarum账号，请忽略此邮件。

        此链接将在24小时后失效。

        ---
        PyFlarum团队
        """

        # HTML内容
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #3498db; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>PyFlarum</h1>
                </div>
                <div class="content">
                    <h2>您好 {username}，</h2>
                    <p>感谢您注册PyFlarum！</p>
                    <p>请点击下方按钮验证您的邮箱：</p>
                    <a href="{verification_url}" class="button">验证邮箱</a>
                    <p>或复制以下链接到浏览器：</p>
                    <p style="word-break: break-all; color: #666;">{verification_url}</p>
                    <p>如果您没有注册PyFlarum账号，请忽略此邮件。</p>
                    <p style="color: #999; font-size: 14px;">此链接将在24小时后失效。</p>
                </div>
                <div class="footer">
                    <p>PyFlarum团队</p>
                </div>
            </div>
        </body>
        </html>
        """

        return EmailService._send_email(
            subject=subject,
            text_content=text_content,
            html_content=html_content,
            to_email=user_email
        )

    @staticmethod
    def send_password_reset_email(user_email: str, username: str, token: str) -> bool:
        """
        发送密码重置邮件

        Args:
            user_email: 用户邮箱
            username: 用户名
            token: 重置令牌

        Returns:
            bool: 是否发送成功
        """
        subject = '重置您的密码 - PyFlarum'

        # 生成重置链接
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        # 纯文本内容
        text_content = f"""
        您好 {username}，

        我们收到了重置您密码的请求。

        请点击以下链接重置密码：
        {reset_url}

        如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。

        此链接将在1小时后失效。

        ---
        PyFlarum团队
        """

        # HTML内容
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #e74c3c; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>PyFlarum</h1>
                </div>
                <div class="content">
                    <h2>您好 {username}，</h2>
                    <p>我们收到了重置您密码的请求。</p>
                    <p>请点击下方按钮重置密码：</p>
                    <a href="{reset_url}" class="button">重置密码</a>
                    <p>或复制以下链接到浏览器：</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <div class="warning">
                        <strong>注意：</strong>如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。
                    </div>
                    <p style="color: #999; font-size: 14px;">此链接将在1小时后失效。</p>
                </div>
                <div class="footer">
                    <p>PyFlarum团队</p>
                </div>
            </div>
        </body>
        </html>
        """

        return EmailService._send_email(
            subject=subject,
            text_content=text_content,
            html_content=html_content,
            to_email=user_email
        )

    @staticmethod
    def send_notification_email(
        user_email: str,
        username: str,
        notification_type: str,
        notification_data: dict
    ) -> bool:
        """
        发送通知邮件

        Args:
            user_email: 用户邮箱
            username: 用户名
            notification_type: 通知类型
            notification_data: 通知数据

        Returns:
            bool: 是否发送成功
        """
        # 根据通知类型生成邮件内容
        if notification_type == 'discussionReply':
            subject = f'您的讨论有新回复 - PyFlarum'
            discussion_title = notification_data.get('discussion_title', '')
            discussion_url = f"{settings.FRONTEND_URL}/d/{notification_data.get('discussion_id')}"

            text_content = f"""
            您好 {username}，

            您的讨论 "{discussion_title}" 有新回复。

            查看详情：{discussion_url}

            ---
            PyFlarum团队
            """

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #2ecc71; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #2ecc71; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                    .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>PyFlarum</h1>
                    </div>
                    <div class="content">
                        <h2>您好 {username}，</h2>
                        <p>您的讨论 <strong>"{discussion_title}"</strong> 有新回复。</p>
                        <a href="{discussion_url}" class="button">查看详情</a>
                    </div>
                    <div class="footer">
                        <p>PyFlarum团队</p>
                        <p><a href="{settings.FRONTEND_URL}/settings/notifications">管理通知设置</a></p>
                    </div>
                </div>
            </body>
            </html>
            """

        elif notification_type == 'postLiked':
            subject = f'您的帖子被点赞 - PyFlarum'
            discussion_title = notification_data.get('discussion_title', '')
            discussion_url = f"{settings.FRONTEND_URL}/d/{notification_data.get('discussion_id')}"

            text_content = f"""
            您好 {username}，

            您在 "{discussion_title}" 中的帖子被点赞了。

            查看详情：{discussion_url}

            ---
            PyFlarum团队
            """

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #f39c12; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background: #f9f9f9; }}
                    .button {{ display: inline-block; padding: 12px 24px; background: #f39c12; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                    .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>PyFlarum</h1>
                    </div>
                    <div class="content">
                        <h2>您好 {username}，</h2>
                        <p>您在 <strong>"{discussion_title}"</strong> 中的帖子被点赞了。</p>
                        <a href="{discussion_url}" class="button">查看详情</a>
                    </div>
                    <div class="footer">
                        <p>PyFlarum团队</p>
                        <p><a href="{settings.FRONTEND_URL}/settings/notifications">管理通知设置</a></p>
                    </div>
                </div>
            </body>
            </html>
            """

        else:
            # 默认通知邮件
            subject = f'您有新通知 - PyFlarum'
            text_content = f"您好 {username}，\n\n您有新通知。\n\n---\nPyFlarum团队"
            html_content = f"<p>您好 {username}，</p><p>您有新通知。</p>"

        return EmailService._send_email(
            subject=subject,
            text_content=text_content,
            html_content=html_content,
            to_email=user_email
        )

    @staticmethod
    def _send_email(
        subject: str,
        text_content: str,
        html_content: str,
        to_email: str,
        from_email: Optional[str] = None
    ) -> bool:
        """
        发送邮件（内部方法）

        Args:
            subject: 邮件主题
            text_content: 纯文本内容
            html_content: HTML内容
            to_email: 收件人邮箱
            from_email: 发件人邮箱（可选）

        Returns:
            bool: 是否发送成功
        """
        try:
            if from_email is None:
                from_email = settings.DEFAULT_FROM_EMAIL

            # 创建邮件
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[to_email]
            )

            # 添加HTML内容
            email.attach_alternative(html_content, "text/html")

            # 发送邮件
            email.send()

            logger.info(f"邮件发送成功: {to_email} - {subject}")
            return True

        except Exception as e:
            logger.error(f"邮件发送失败: {to_email} - {subject} - {str(e)}")
            return False
