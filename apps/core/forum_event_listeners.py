from __future__ import annotations

from collections import OrderedDict
from types import SimpleNamespace

from apps.core.domain_events import get_forum_event_bus
from apps.core.websocket_service import WebSocketService
from apps.core.forum_events import (
    DiscussionApprovedEvent,
    DiscussionCreatedEvent,
    DiscussionHiddenEvent,
    DiscussionLockedEvent,
    DiscussionRejectedEvent,
    DiscussionRenamedEvent,
    DiscussionResubmittedEvent,
    DiscussionStickyChangedEvent,
    DiscussionTaggedEvent,
    PostApprovedEvent,
    PostCreatedEvent,
    DiscussionTagStatsRefreshEvent,
    PostHiddenEvent,
    PostLikedEvent,
    PostRejectedEvent,
    PostResubmittedEvent,
    TagStatsRefreshRequestedEvent,
    UserMentionedEvent,
    UserSuspendedEvent,
    UserUnsuspendedEvent,
)
from apps.core.forum_timeline import (
    build_discussion_hidden_content,
    build_discussion_locked_content,
    build_discussion_renamed_content,
    build_discussion_resubmitted_content,
    build_discussion_review_content,
    build_discussion_sticky_content,
    build_discussion_tagged_content,
    build_post_hidden_content,
    build_post_resubmitted_content,
    build_post_review_content,
    create_timeline_event_post,
)


_listeners_bootstrapped = False


def bootstrap_forum_event_listeners() -> None:
    global _listeners_bootstrapped
    if _listeners_bootstrapped:
        return

    event_bus = get_forum_event_bus()
    event_bus.register(DiscussionCreatedEvent, handle_discussion_created)
    event_bus.register(DiscussionApprovedEvent, handle_discussion_approved)
    event_bus.register(DiscussionRenamedEvent, handle_discussion_renamed)
    event_bus.register(DiscussionTaggedEvent, handle_discussion_tagged)
    event_bus.register(DiscussionLockedEvent, handle_discussion_locked)
    event_bus.register(DiscussionStickyChangedEvent, handle_discussion_sticky_changed)
    event_bus.register(DiscussionHiddenEvent, handle_discussion_hidden)
    event_bus.register(DiscussionRejectedEvent, handle_discussion_rejected)
    event_bus.register(DiscussionResubmittedEvent, handle_discussion_resubmitted)
    event_bus.register(PostCreatedEvent, handle_post_created)
    event_bus.register(PostApprovedEvent, handle_post_approved)
    event_bus.register(PostRejectedEvent, handle_post_rejected)
    event_bus.register(PostResubmittedEvent, handle_post_resubmitted)
    event_bus.register(PostHiddenEvent, handle_post_hidden)
    event_bus.register(PostLikedEvent, handle_post_liked)
    event_bus.register(UserMentionedEvent, handle_user_mentioned)
    event_bus.register(UserSuspendedEvent, handle_user_suspended)
    event_bus.register(UserUnsuspendedEvent, handle_user_unsuspended)
    event_bus.register(DiscussionTagStatsRefreshEvent, handle_discussion_tag_stats_refresh)
    event_bus.register(TagStatsRefreshRequestedEvent, handle_tag_stats_refresh_requested)
    _listeners_bootstrapped = True


def handle_discussion_created(event: DiscussionCreatedEvent) -> None:
    if event.tag_ids:
        from apps.tags.services import TagService

        TagService.refresh_tag_stats(list(event.tag_ids))

    if event.is_approved:
        _broadcast_discussion_event(
            event.discussion_id,
            "discussion.created",
            include_discussion=True,
            include_post=True,
            post_id_getter=lambda discussion: discussion.first_post_id,
        )

def handle_discussion_approved(event: DiscussionApprovedEvent) -> None:
    from apps.discussions.models import Discussion
    from apps.notifications.services import NotificationService
    from apps.tags.services import TagService
    from apps.users.models import User

    try:
        discussion = Discussion.objects.select_related("user").get(id=event.discussion_id)
        admin_user = User.objects.get(id=event.admin_user_id)
    except (Discussion.DoesNotExist, User.DoesNotExist):
        return

    NotificationService.notify_discussion_approved(discussion, admin_user, note=event.note)
    TagService.refresh_discussion_tag_stats(discussion.id)
    _broadcast_discussion_event(
        event.discussion_id,
        "discussion.approved",
        include_discussion=True,
        include_post=True,
        post_id_getter=lambda current_discussion: current_discussion.first_post_id,
    )
    create_timeline_event_post(
        discussion_id=discussion.id,
        actor_user_id=admin_user.id,
        post_type="discussionApproved",
        update_discussion_last_post=False,
        content=build_discussion_review_content(
            SimpleNamespace(
                post_type="discussionApproved",
                previous_status="pending",
                note=event.note,
            )
        )[1],
    )


def handle_discussion_renamed(event: DiscussionRenamedEvent) -> None:
    _broadcast_discussion_event(event.discussion_id, "discussion.renamed", include_discussion=True)
    _create_timeline_from_builder(
        _make_timeline_context(event, post_type="discussionRenamed"),
        build_discussion_renamed_content,
    )


def handle_discussion_tagged(event: DiscussionTaggedEvent) -> None:
    from apps.tags.services import TagService

    if event.tag_ids:
        TagService.refresh_tag_stats(list(event.tag_ids))
    else:
        TagService.refresh_discussion_tag_stats(event.discussion_id)
    _broadcast_discussion_event(
        event.discussion_id,
        "discussion.tagged",
        include_discussion=True,
        tag_ids=list(event.tag_ids) if event.tag_ids else None,
    )
    _create_timeline_from_builder(
        _make_timeline_context(event, post_type="discussionTagged"),
        build_discussion_tagged_content,
    )


def handle_discussion_locked(event: DiscussionLockedEvent) -> None:
    _broadcast_discussion_event(event.discussion_id, "discussion.locked", include_discussion=True)
    _create_timeline_from_builder(
        _make_timeline_context(event, post_type="discussionLocked"),
        build_discussion_locked_content,
    )


def handle_discussion_sticky_changed(event: DiscussionStickyChangedEvent) -> None:
    _broadcast_discussion_event(event.discussion_id, "discussion.sticky_changed", include_discussion=True)
    _create_timeline_from_builder(
        _make_timeline_context(event, post_type="discussionSticky"),
        build_discussion_sticky_content,
    )


def handle_discussion_hidden(event: DiscussionHiddenEvent) -> None:
    _broadcast_discussion_event(event.discussion_id, "discussion.hidden")
    _create_timeline_from_builder(
        _make_timeline_context(event, post_type="discussionHidden"),
        build_discussion_hidden_content,
    )


def handle_discussion_rejected(event: DiscussionRejectedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.discussions.models import Discussion
    from apps.users.models import User

    try:
        discussion = Discussion.objects.select_related("user").get(id=event.discussion_id)
        admin_user = User.objects.get(id=event.admin_user_id)
    except (Discussion.DoesNotExist, User.DoesNotExist):
        return

    NotificationService.notify_discussion_rejected(discussion, admin_user, note=event.note)
    _broadcast_discussion_event(
        event.discussion_id,
        "discussion.rejected",
    )
    _create_timeline_from_builder(
        _make_timeline_context(
            event,
            actor_user_id=event.admin_user_id,
            post_type="discussionRejected",
        ),
        build_discussion_review_content,
    )


def handle_discussion_resubmitted(event: DiscussionResubmittedEvent) -> None:
    _broadcast_discussion_event(
        event.discussion_id,
        "discussion.resubmitted",
    )
    _create_timeline_from_builder(
        _make_timeline_context(
            event,
            post_type="discussionResubmitted",
        ),
        build_discussion_resubmitted_content,
    )


def handle_post_created(event: PostCreatedEvent) -> None:
    from apps.tags.services import TagService

    if event.is_approved:
        TagService.refresh_discussion_tag_stats(event.discussion_id)
        _broadcast_discussion_event(
            event.discussion_id,
            "post.created",
            include_discussion=True,
            include_post=True,
            post_id=event.post_id,
        )
    if not event.is_approved:
        return

    from apps.notifications.services import NotificationService
    from apps.users.models import User

    try:
        from_user = User.objects.get(id=event.actor_user_id)
    except User.DoesNotExist:
        return

    NotificationService.notify_discussion_reply(
        discussion_id=event.discussion_id,
        post_id=event.post_id,
        from_user=from_user,
    )
    if event.reply_to_post_id:
        NotificationService.notify_post_reply(
            reply_to_post_id=event.reply_to_post_id,
            post_id=event.post_id,
            from_user=from_user,
        )

def handle_post_approved(event: PostApprovedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.posts.models import Post
    from apps.tags.services import TagService
    from apps.users.models import User

    try:
        post = Post.objects.select_related("user", "discussion").get(id=event.post_id)
        admin_user = User.objects.get(id=event.admin_user_id)
    except (Post.DoesNotExist, User.DoesNotExist):
        return

    if event.actor_user_id:
        try:
            from_user = User.objects.get(id=event.actor_user_id)
        except User.DoesNotExist:
            from_user = None
        if from_user:
            NotificationService.notify_discussion_reply(
                discussion_id=event.discussion_id,
                post_id=event.post_id,
                from_user=from_user,
            )

    NotificationService.notify_post_approved(post, admin_user, note=event.note)
    TagService.refresh_discussion_tag_stats(event.discussion_id)
    _broadcast_discussion_event(event.discussion_id, "post.approved", include_discussion=True, post_id=event.post_id)
    enriched_event = _make_timeline_context(
        event,
        actor_user_id=event.admin_user_id,
        post_type="postApproved",
        post_number=getattr(post, "number", None),
    )
    _create_timeline_from_builder(enriched_event, build_post_review_content)


def handle_post_rejected(event: PostRejectedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.posts.models import Post
    from apps.users.models import User

    try:
        post = Post.objects.select_related("discussion", "user").get(id=event.post_id)
        admin_user = User.objects.get(id=event.admin_user_id)
    except (Post.DoesNotExist, User.DoesNotExist):
        return

    NotificationService.notify_post_rejected(post, admin_user, note=event.note)
    _broadcast_discussion_event(event.discussion_id, "post.rejected")
    enriched_event = _make_timeline_context(
        event,
        actor_user_id=event.admin_user_id,
        post_type="postRejected",
        post_number=getattr(post, "number", None),
    )
    _create_timeline_from_builder(enriched_event, build_post_review_content)


def handle_post_resubmitted(event: PostResubmittedEvent) -> None:
    from apps.posts.models import Post

    try:
        post = Post.objects.get(id=event.post_id)
    except Post.DoesNotExist:
        return

    enriched_event = _make_timeline_context(
        event,
        post_type="postResubmitted",
        post_number=getattr(post, "number", None),
    )
    _broadcast_discussion_event(event.discussion_id, "post.resubmitted")
    _create_timeline_from_builder(enriched_event, build_post_resubmitted_content)


def handle_post_hidden(event: PostHiddenEvent) -> None:
    _broadcast_discussion_event(event.discussion_id, "post.hidden")
    _create_timeline_from_builder(
        _make_timeline_context(
            event,
            post_type="postHidden",
        ),
        build_post_hidden_content,
    )


def handle_post_liked(event: PostLikedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.users.models import User

    try:
        from_user = User.objects.get(id=event.actor_user_id)
    except User.DoesNotExist:
        return

    NotificationService.notify_post_liked(post_id=event.post_id, from_user=from_user)


def handle_user_mentioned(event: UserMentionedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.users.models import User

    try:
        mentioned_user = User.objects.get(id=event.mentioned_user_id)
    except User.DoesNotExist:
        return

    from_user = None
    if event.actor_user_id:
        from_user = User.objects.filter(id=event.actor_user_id).first()
    if from_user is None:
        return

    NotificationService.notify_user_mentioned(
        post_id=event.post_id,
        mentioned_user=mentioned_user,
        from_user=from_user,
    )


def handle_user_suspended(event: UserSuspendedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.users.models import User

    user = User.objects.filter(id=event.user_id).first()
    if user is None:
        return

    admin_user = None
    if event.actor_user_id:
        admin_user = User.objects.filter(id=event.actor_user_id).first()

    NotificationService.notify_user_suspended(user, admin_user)


def handle_user_unsuspended(event: UserUnsuspendedEvent) -> None:
    from apps.notifications.services import NotificationService
    from apps.users.models import User

    user = User.objects.filter(id=event.user_id).first()
    if user is None:
        return

    admin_user = None
    if event.actor_user_id:
        admin_user = User.objects.filter(id=event.actor_user_id).first()

    NotificationService.notify_user_unsuspended(user, admin_user)


def handle_discussion_tag_stats_refresh(event: DiscussionTagStatsRefreshEvent) -> None:
    from apps.tags.services import TagService

    TagService.refresh_discussion_tag_stats(event.discussion_id)


def handle_tag_stats_refresh_requested(event: TagStatsRefreshRequestedEvent) -> None:
    if not event.tag_ids:
        return

    from apps.tags.services import TagService

    TagService.dispatch_refresh_tag_stats(list(event.tag_ids))


def _create_timeline_from_builder(event, builder) -> None:
    built = builder(event)
    if not built:
        return

    post_type, content = built
    update_discussion_last_post = post_type not in {
        "discussionApproved",
        "discussionRejected",
        "discussionResubmitted",
        "postApproved",
        "postRejected",
        "postResubmitted",
    }
    create_timeline_event_post(
        discussion_id=event.discussion_id,
        actor_user_id=event.actor_user_id,
        post_type=post_type,
        content=content,
        update_discussion_last_post=update_discussion_last_post,
    )


def _make_timeline_context(event, **extra):
    payload = dict(getattr(event, "__dict__", {}))
    payload.update(extra)
    return SimpleNamespace(**payload)


def _broadcast_discussion_event(
    discussion_id: int,
    event_type: str,
    *,
    include_discussion: bool = False,
    include_post: bool = False,
    post_id: int | None = None,
    post_id_getter=None,
    tag_ids: list[int] | None = None,
) -> None:
    payload = {}
    discussion = _load_discussion_for_realtime(discussion_id) if include_discussion or post_id_getter else None
    if include_discussion and discussion is not None:
        payload["discussion"] = _serialize_discussion_for_realtime(discussion)

    resolved_post_id = post_id
    if resolved_post_id is None and discussion is not None and post_id_getter is not None:
        resolved_post_id = post_id_getter(discussion)

    if include_post and resolved_post_id:
        post_payload = _serialize_post_for_realtime(resolved_post_id)
        if post_payload is not None:
            payload["post"] = post_payload

    payload.update(
        _build_realtime_included_payload(
            discussion=discussion,
            post_payload=payload.get("post"),
            tag_ids=tag_ids,
        )
    )

    WebSocketService.broadcast_discussion_event(
        discussion_id,
        event_type,
        payload,
    )


def _load_discussion_for_realtime(discussion_id: int):
    from apps.discussions.models import Discussion
    from apps.discussions.api import _apply_discussion_resource_preloads

    discussion = (
        _apply_discussion_resource_preloads(Discussion.objects.all(), user=None)
        .filter(id=discussion_id)
        .first()
    )
    return discussion


def _serialize_discussion_for_realtime(discussion):
    from apps.discussions.api import _serialize_discussion_payload

    return _serialize_discussion_payload(discussion, user=None)


def _serialize_post_for_realtime(post_id: int):
    from django.db.models import Count

    from apps.posts.api import _apply_post_resource_preloads, _serialize_post
    from apps.posts.models import Post

    post = (
        _apply_post_resource_preloads(
            Post.objects.select_related("discussion").annotate(
                like_count=Count("likes", distinct=True)
            ),
            user=None,
        )
        .filter(id=post_id)
        .first()
    )
    if post is None:
        return None
    post.is_liked = False
    return _serialize_post(post, user=None)


def _build_realtime_included_payload(
    *,
    discussion=None,
    post_payload: dict | None = None,
    tag_ids: list[int] | None = None,
) -> dict:
    users = OrderedDict()
    tags = OrderedDict()

    if discussion is not None:
        _collect_discussion_users(users, discussion)
        _collect_discussion_tags(tags, discussion)
    elif tag_ids:
        _collect_tags_by_ids(tags, tag_ids)

    if post_payload:
        _collect_post_users(users, post_payload)

    payload = {}
    if users:
        payload["users"] = list(users.values())
    if tags:
        payload["tags"] = list(tags.values())
    return payload


def _collect_discussion_users(target: OrderedDict, discussion) -> None:
    from apps.core.forum_resources import serialize_user_payload

    for user in (
        getattr(discussion, "user", None),
        getattr(discussion, "last_posted_user", None),
    ):
        payload = serialize_user_payload(user, resource="discussion_user")
        if payload and payload.get("id") is not None:
            _merge_included_resource(target, payload)


def _collect_post_users(target: OrderedDict, post_payload: dict) -> None:
    for key in ("user", "edited_user"):
        payload = post_payload.get(key)
        if payload and payload.get("id") is not None:
            _merge_included_resource(target, payload)


def _collect_discussion_tags(target: OrderedDict, discussion) -> None:
    from apps.tags.api import _serialize_tag

    for tag in _iter_discussion_tags(discussion):
        _merge_tag_payload(target, tag)


def _collect_tags_by_ids(target: OrderedDict, tag_ids: list[int]) -> None:
    from apps.tags.models import Tag

    for tag in Tag.objects.select_related("last_posted_discussion").filter(id__in=tag_ids):
        _merge_tag_payload(target, tag)


def _iter_discussion_tags(discussion):
    links = getattr(discussion, "discussion_tags", None)
    if links is None:
        return []
    resolved = []
    for link in links.all() if hasattr(links, "all") else links:
        tag = getattr(link, "tag", None)
        if tag is not None:
            resolved.append(tag)
    return resolved


def _merge_included_resource(target: OrderedDict, payload: dict) -> None:
    resource_id = int(payload["id"])
    target[resource_id] = {
        **(target.get(resource_id) or {}),
        **payload,
    }


def _merge_tag_payload(target: OrderedDict, tag) -> None:
    from apps.tags.api import _serialize_tag

    payload = _serialize_tag(tag, user=None, include_children=False)
    if not payload or payload.get("id") is None:
        return
    target[int(payload["id"])] = payload
