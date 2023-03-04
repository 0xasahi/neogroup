import json
from django.conf import settings
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.http import JsonResponse
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from mastodon.api import share_topic, share_comment
from users.models import User
from common.config import ITEMS_PER_PAGE
from group.models import Group, Topic, GroupMember, Comment, LikeComment
from group.forms import TopicForm, GroupSettingsForm


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
    last_join_users = [u.to_json() for u in group.groupmember_set.order_by("-id")[:8]]
    last_topics = [t.to_json() for t in group.topic_set.order_by("-id")[:5]]
    is_member = GroupMember.is_member(
        request.user, group) if request.user.is_authenticated else False

    group_props = {
        "group": group.to_json(),
        "is_member": is_member,
        "last_topics": last_topics,
    }

    sidebar_props = {
        "last_join_users": last_join_users,
    }

    return render(request, "group/react_group.html", {
        "title": group.name,
        "group_props": group_props,
        "sidebar": sidebar_props})


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
    if request.method == "POST":
        form = TopicForm(request.POST)
        if form.is_valid():
            topic = form.save(commit=False)
            topic.group = topic_group
            topic.user = request.user
            topic.type = 0
            topic.save()
            if form.cleaned_data["share_to_mastodon"]:
                form.instance.save = lambda **args: None
                form.instance.shared_link = None
                if not share_topic(form.instance):
                    return render_relogin(request)
            return redirect("group:group", group_id=group_id)
        else:
            return render(
                request,
                "common/error.html",
                {
                    "msg": "必须填写话题标题和话题内容",
                    "secondary_msg": "",
                },
            )
    topic_form = TopicForm()
    last_topics = topic_group.topic_set.order_by("-id")[:5]
    return render(request, "group/new_topic.html", {"form": topic_form, "group": topic_group,
                                                    "last_topics": last_topics})


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
            return JsonResponse({
                "msg": "你不是小组成员，不能参与话题讨论",
                "r": 1,
            })
        data = json.loads(request.body.decode('utf-8'))
        comment_reply_id = data.get("comment_reply")
        content = data.get("content")
        comment_reply = None
        if not content:
            return JsonResponse({
                "msg": "必须填写评论内容",
                "r": 1,
            })

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

        return JsonResponse({
            "msg": "ok",
            "r": 0,
        })

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
    topic_props.update({
        "comments": comments,
        "is_member": is_member,
        "page": page,
        "page_size": page_size,
        "total": total,
    })

    sidebar_props = {
        "last_topics": last_topics,
        "group": topic.group.to_json(),
    }

    return render(request, "group/react_topic.html", {
        "title": topic.title,
        "topic": topic_props,
        "sidebar": sidebar_props})


def get_comments(request, topic_id):
    topic = Topic.objects.filter(id=topic_id).first()
    if not topic:
        return JsonResponse({
            "msg": "话题不存在",
            "r": 1,
        })
    page = request.GET.get("page") or 1
    per_page = ITEMS_PER_PAGE
    start = (int(page) - 1) * per_page

    comments = topic.get_comments_dict(request.user, start, per_page)
    return JsonResponse({
        "msg": "ok",
        "r": 0,
        "comments": comments,
    })


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
        return JsonResponse({
            "msg": "评论不存在",
            "r": 1,
        })
    if request.user != comment.user:
        return JsonResponse({
            "msg": "你没有权限",
            "r": 1,
        })
    comment.delete()
    return JsonResponse({
        "msg": "ok",
        "r": 0,
    })


def join(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return JsonResponse(
          
            {
                "msg": "小组不存在",
                "r": 1,
            },
        )
    if not GroupMember.is_member(request.user, group):
        GroupMember.objects.create(user=request.user, group=group)
    else:
        return JsonResponse({
            "msg": "你已经是小组成员了",
            "r": 1,
        })

        
    return  JsonResponse({
        'mag': "加入成功",
        "r" : 0
    })
    # return redirect("group:group", group_id=group_id)


def leave(request, group_id):
    group = Group.objects.filter(id=group_id).first()
    if not group:
        return JsonResponse(

            {
                "msg": "小组不存在",
                "r": 1,
            },
        )
    if GroupMember.is_member(request.user, group):
        GroupMember.objects.filter(user=request.user, group=group).delete()
    else:
        return JsonResponse({
            'msg': "你不是小组成员",
            "r": 1
        })
    return JsonResponse({
         'msg': "退出成功",
        'r': 0
    })


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


def like_comment(request, comment_id):
    if request.method != "POST":
        return JsonResponse({
            "msg": "请求方式错误",
            "r": 1,
        })
    comment = Comment.objects.filter(id=comment_id).first()
    if not comment:
        return JsonResponse({
            "msg": "评论不存在",
            "r": 1,
        })
    if not request.user.is_authenticated:
        return JsonResponse({
            "msg": "请先登录",
            "r": 1
        })
    if not comment.is_liked_by(request.user):
        liked = 1
        LikeComment.objects.create(user=request.user, comment=comment)
    else:
        LikeComment.objects.filter(user=request.user, comment=comment).delete()
        liked = 0
    return JsonResponse({
        "msg": "ok",
        "r": 0,
        "liked": liked,
    })
