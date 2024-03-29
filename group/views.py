import json
from functools import wraps
from django.conf import settings
from django.urls import reverse
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.utils.translation import gettext_lazy as _
from django.views.decorators.http import require_http_methods
from mastodon.api import share_topic, share_comment
from common.config import ITEMS_PER_PAGE
from users.models import User
from group.models import Group, Topic, GroupMember, Comment, LikeComment
from group.forms import TopicForm, GroupSettingsForm


def success(msg="", data=None):
    return JsonResponse({"r": 0, "msg": msg, "data": data})


def error(msg):
    return JsonResponse({"r": 1, "msg": msg})


def render_relogin(request):
    return render(
        request,
        "common/error.html",
        {
            "url": reverse("users:connect") + "?domain=" + request.user.mastodon_site,
            "msg": _("信息已保存，但是未能分享到联邦网络"),
            "secondary_msg": _(
                "可能是你在联邦网络(Mastodon/Pleroma/...)的登录状态过期了，正在跳转到联邦网络重新登录😼"
            ),
        },
    )


def j_login_required(f):
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return error("请先登录")
        return f(request, *args, **kwargs)
    return wrapper


def create(request):
    if request.method == "POST":
        name = request.POST["grp_name"].strip()
        description = request.POST["grp_content"]
        if name and description:
            group = Group()
            group.user = request.user
            group.name = name
            group.description = description
            group.save()
            GroupMember.objects.create(user=request.user, group=group)
            return redirect("group:group", group_id=group.id)
        else:
            return render(
                request,
                "common/error.html",
                {
                    "msg": "必须填写小组名称和小组简介",
                    "secondary_msg": "",
                },
            )
    return render(request, "group/create.html", {"site_name": settings.SITE_INFO["site_name"]})


def group(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return render(
            request,
            "common/error.html",
            {
                "msg": "小组不存在",
                "secondary_msg": "",
            },
        )
    page = int(request.GET.get("page", 1))
    page_size = ITEMS_PER_PAGE
    start = (page-1)*page_size

    last_join_users = [u.to_json()
                       for u in group.groupmember_set.order_by("-id")[:8]]
    last_topics = [t.to_json() for t in group.topic_set.order_by(
        "-id")[start: start+page_size]]
    is_member = GroupMember.is_member(
        request.user, group) if request.user.is_authenticated else False

    group_props = {
        "group": group.to_json(),
        "is_member": is_member,
        "last_topics": last_topics,
        "page_size": page_size,
        "page": page,
        "total": group.topic_set.count()
    }
    operations = []
    if request.user == group.user:
        operations = [
            [f"/group/{group.id}/group_edit", '小组管理'],
        ]

    sidebar_props = {
        "last_join_users": last_join_users,
        "operations": operations
    }

    nav_props = {
        "title": group.display_name,
    }

    return render(request, "group/group.html", {
        "title": group.display_name,
        "nav_props": nav_props,
        "group_props": group_props,
        "sidebar": sidebar_props,
        "group": group
    })


def get_topics(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return error("小组不存在")
    page = request.GET.get("page") or 1
    per_page = ITEMS_PER_PAGE
    start = (int(page) - 1) * per_page

    topics = [t.to_json()
              for t in group.topic_set.order_by("-id")[start:start + per_page]]
    return success(data=topics)


def new_topic(request, group_id):
    topic_group = Group.objects.filter(id=group_id).first()
    if not topic_group:
        return render(
            request,
            "common/error.html",
            {
                "msg": "小组不存在",
                "secondary_msg": "",
            },
        )

    is_member = GroupMember.is_member(
        request.user, topic_group) if request.user.is_authenticated else False

    if request.method == "POST":
        if not is_member:
            return error("你不是小组成员，不能参与话题讨论")

        data = json.loads(request.body)
        title = data.get("title")
        description = data.get("content")
        if not title or not description:
            return error("标题和内容不能为空")

        topic = Topic.objects.create(
            user=request.user,
            title=title.strip(),
            description=description,
            group=topic_group,
        )
        topic.type = 0
        topic.save()
        if data.get("share_to_mastodon"):
            topic.save = lambda **args: None
            topic.shared_link = None
            share_topic(topic)

        return success(
            data={
                'redirect_uri': topic.absolute_url
            }
        )

    if not is_member:
        return render(
            request,
            "common/error.html",
            {
                "msg": "你不是小组成员，不能参与话题讨论",
                "secondary_msg": "",
            },
        )

    return render(request, "group/react_new_topic.html", {
        "group": topic_group,
        "title": "在%s发新帖" % topic_group.display_name,
        "submit_api": "/group/%s/new_topic" % topic_group.id,
        "nav_props": {
            "title":  "在%s发新帖" % topic_group.display_name},
    })


def topic(request, topic_id):
    topic = Topic.objects.filter(id=topic_id).first()
    is_member = GroupMember.is_member(
        request.user, topic.group) if request.user.is_authenticated else False
    if not topic:
        return render(
            request,
            "common/error.html",
            {
                "msg": "话题不存在",
                "secondary_msg": "",
            },
        )
    if request.method == "POST":
        if not is_member:
            return error("你不是小组成员，不能参与话题讨论")

        data = json.loads(request.body.decode('utf-8'))
        comment_reply_id = data.get("comment_reply")
        content = data.get("content")
        comment_reply = None
        if not content:
            return error("评论内容不能为空")

        if comment_reply_id:
            comment_reply = Comment.objects.filter(id=comment_reply_id).first()
        comment = Comment.objects.create(
            user=request.user,
            topic=topic,
            content=content,
            comment_reply=comment_reply,
        )
        topic.updated_at = comment.created_at
        topic.save()

        if data.get("share_to_mastodon"):
            # TODO If there is a comment_reply field, it should be at the corresponding user in mastodon
            comment.save = lambda **args: None
            comment.shared_link = None
            if not share_comment(comment):
                # FIXME: ajax need_login attention
                return render_relogin(request)

        return success()

    comment_id = request.GET.get("comment_id")
    page = int(request.GET.get("page", 1))
    page_size = ITEMS_PER_PAGE
    total = Comment.objects.filter(topic=topic).count()
    # get page index by comment_id
    if comment_id:
        comment = Comment.objects.filter(topic=topic, id=comment_id).first()
        if comment:
            index = list(topic.comment_set.order_by(
                "id").values_list('id', flat=True)).index(comment.id)
            page = index // page_size + 1

    comments = topic.get_comments_dict(
        request.user, (page-1)*page_size, page_size)

    last_topics = [t.to_json()
                   for t in topic.group.topic_set.order_by("-id")[:5]]

    topic_props = topic.to_json()
    topic_group = topic.group

    topic_props.update({
        "comments": comments,
        "is_member": is_member,
        "page": page,
        "page_size": page_size,
        "total": total,
    })

    sidebar_props = {
        "last_topics": last_topics,
        "group": topic_group.to_json()
    }

    nav_props = {
        "card": {
            "url": topic_group.absolute_url,
            "icon": str(topic_group.icon_url),
            "name": topic_group.display_name,
        },
        "title": topic.title,
    }

    return render(request, "group/topic.html", {
        "title": topic.title,
        "topic": topic_props,
        "sidebar": sidebar_props,
        "nav_props": nav_props
    })


def get_comments(request, topic_id):
    topic = Topic.objects.filter(id=topic_id).first()
    if not topic:
        return error("话题不存在")
    page = request.GET.get("page") or 1
    per_page = ITEMS_PER_PAGE
    start = (int(page) - 1) * per_page

    comments = topic.get_comments_dict(request.user, start, per_page)
    return success(data=comments)


def delete_topic(request, topic_id):
    topic = Topic.objects.filter(id=topic_id).first()
    if not topic:
        return render(
            request,
            "common/error.html",
            {
                "msg": "话题不存在",
                "secondary_msg": "",
            },
        )
    if request.user != topic.user:
        return render(
            request,
            "common/error.html",
            {
                "msg": "你不是话题作者，不能删除话题",
                "secondary_msg": "",
            },
        )
    if topic.comment_set.count() > 0:
        return render(
            request,
            "common/error.html",
            {
                "msg": "话题有评论，不能删除",
                "secondary_msg": "",
            },
        )
    topic.delete()
    return redirect("group:group", group_id=topic.group.id)


def delete_comment(request, comment_id):
    comment = Comment.objects.filter(id=comment_id).first()
    if not comment:
        return error("评论不存在")
    if request.user != comment.user:
        return error("你没有权限")
    comment.delete()
    return success()


def join(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return error("小组不存在")

    if not GroupMember.is_member(request.user, group):
        GroupMember.objects.create(user=request.user, group=group)
    return success()


def leave(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return error("小组不存在")
    if GroupMember.is_member(request.user, group):
        GroupMember.objects.filter(user=request.user, group=group).delete()
    return success()


def group_edit(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return render(
            request,
            "common/error.html",
            {
                "msg": "小组不存在",
                "secondary_msg": "",
            },
        )
    if group.user != request.user:
        return render(
            request,
            "common/error.html",
            {
                "msg": "你不是小组创建者",
                "secondary_msg": "",
            },
        )
    if request.method == "POST":
        form = GroupSettingsForm(request.POST, request.FILES, instance=group)
        if form.is_valid():
            group = form.save(commit=False)
            # group.user = request.user
            group.save()
        return redirect("group:group", group_id=group_id)
    group_form = GroupSettingsForm(instance=group)
    return render(request, "group/group_edit.html", {"form": group_form})


def profile(request, mastodon_username):
    _ = mastodon_username.split("@")
    if len(_) != 2:
        return render(
            request,
            "common/error.html",
            {
                "msg": "该用户不在这个站点，可以邀请TA加入",
                "secondary_msg": "",
            },
        )
    else:
        username, mastodon_site = _
    user = User.objects.filter(
        username=username, mastodon_site=mastodon_site).first()
    if not user:
        return render(
            request,
            "common/error.html",
            {
                "msg": "该用户不在这个站点，可以邀请TA加入",
                "secondary_msg": "",
            },
        )
    join_groups = GroupMember.objects.filter(user=user).order_by("-id")[:50]
    topics = Topic.objects.filter(user=user).order_by("-id")[:20]
    comments = Comment.objects.filter(user=user).order_by("-id")[:20]
    return render(request, "group/profile.html", {"user": user, "join_groups": join_groups, "topics": topics,
                                                  "comments": comments})


@require_http_methods(["POST"])
def like_comment(request, comment_id):
    if request.method == "POST":
        comment = Comment.objects.filter(id=comment_id).first()
        if not comment:
            return error(
                "评论不存在",
            )
        if not comment.is_liked_by(request.user):
            liked = 1
            LikeComment.objects.create(user=request.user, comment=comment)
        else:
            LikeComment.objects.filter(
                user=request.user, comment=comment).delete()
            liked = 0
        return success(
            data=liked,
        )
