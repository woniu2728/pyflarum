from __future__ import annotations

from django.db.models import Q

from apps.discussions.models import Discussion
from apps.posts.models import Post


def _field(prefix: str, name: str) -> str:
    return f"{prefix}{name}" if prefix else name


def build_discussion_visibility_q(user=None, prefix: str = "") -> Q:
    approved_q = Q(
        **{
            _field(prefix, "approval_status"): Discussion.APPROVAL_APPROVED,
            _field(prefix, "hidden_at__isnull"): True,
        }
    )

    if not user or not getattr(user, "is_authenticated", False):
        return approved_q

    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return Q()

    own_pending_q = Q(
        **{
            _field(prefix, "user"): user,
            _field(prefix, "approval_status"): Discussion.APPROVAL_PENDING,
            _field(prefix, "hidden_at__isnull"): True,
        }
    )
    own_rejected_q = Q(
        **{
            _field(prefix, "user"): user,
            _field(prefix, "approval_status"): Discussion.APPROVAL_REJECTED,
        }
    )
    return approved_q | own_pending_q | own_rejected_q


def build_post_visibility_q(user=None, prefix: str = "") -> Q:
    approved_q = Q(
        **{
            _field(prefix, "approval_status"): Post.APPROVAL_APPROVED,
            _field(prefix, "hidden_at__isnull"): True,
        }
    )

    if not user or not getattr(user, "is_authenticated", False):
        return approved_q

    if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
        return Q()

    own_pending_q = Q(
        **{
            _field(prefix, "user"): user,
            _field(prefix, "approval_status"): Post.APPROVAL_PENDING,
            _field(prefix, "hidden_at__isnull"): True,
        }
    )
    own_rejected_q = Q(
        **{
            _field(prefix, "user"): user,
            _field(prefix, "approval_status"): Post.APPROVAL_REJECTED,
        }
    )
    return approved_q | own_pending_q | own_rejected_q
