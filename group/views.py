from django.conf import settings
from django.core.paginator import Paginator
from django.shortcuts import render, redirect
from mastodon.api import share_topic, share_comment
from users.models import User
from group.models import Group, Topic, GroupMember, Comment
from group.forms import TopicForm, CommentForm, GroupSettingsForm


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
    topic_list = group.topic_set.order_by("-updated_at")
    paginator = Paginator(topic_list, 25)
    page_number = int(request.GET.get('page', 1))
    page_obj = paginator.get_page(page_number)
    last_join_users = group.groupmember_set.order_by("-id")[:10]
    last_topics = group.topic_set.order_by("-id")[:5]
    is_member = GroupMember.is_member(request.user, group) if request.user.is_authenticated else False
    return render(request, "group/group.html", {"group": group, "page_obj": page_obj, "last_join_users": last_join_users, "last_topics": last_topics,
                                        "page": request.GET.get('page'), "is_member": is_member})

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
    is_member = GroupMember.is_member(request.user, topic.group) if request.user.is_authenticated else False
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
            return render(
                request,
                "common/error.html",
                {
                    "msg": "你不是小组成员，不能参与话题讨论",
                    "secondary_msg": "",
                },
            )
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.topic = topic
            comment.user = request.user
            comment.save()
            topic.updated_at = comment.created_at
            topic.save()
            if comment_form.cleaned_data["share_to_mastodon"]:
                comment_form.instance.save = lambda **args: None
                comment_form.instance.shared_link = None
                if not share_comment(comment_form.instance):
                    return render_relogin(request)
            return redirect("group:topic", topic_id=topic.id)
        else:
            return render(
                request,
                "common/error.html",
                {
                    "msg": "必须填写评论内容",
                    "secondary_msg": "",
                },
            )
    comment_form = CommentForm()
    comment_list = topic.comment_set.order_by("id")
    paginator = Paginator(comment_list, 25)
    page_number = int(request.GET.get('page', 1))
    page_obj = paginator.get_page(page_number)
    last_topics = topic.group.topic_set.order_by("-id")[:5]
    return render(request, "group/topic.html", {"topic": topic, "form": comment_form, "page_obj": page_obj, "group": topic.group,
                                            "last_topics": last_topics, "is_member": is_member})

def join(request, group_id):
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
    if not GroupMember.is_member(request.user, group):
        GroupMember.objects.create(user=request.user, group=group)
    else:
        return render(
            request,
            "common/error.html",
            {
                "msg": "你已经是小组成员了",
                "secondary_msg": "",
            },
        )
    return redirect("group:group", group_id=group_id)

def leave(request, group_id):
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
    if GroupMember.is_member(request.user, group):
        GroupMember.objects.filter(user=request.user, group=group).delete()
    else:
        return render(
            request,
            "common/error.html",
            {
                "msg": "你不是小组成员",
                "secondary_msg": "",
            },
        )
    return redirect("group:group", group_id=group_id)

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
        return redirect("group:group_edit", group_id=group_id)
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
    user = User.objects.filter(username=username, mastodon_site=mastodon_site).first()
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