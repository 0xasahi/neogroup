from django.shortcuts import render
from group.models import Group, Topic, Comment
from users.models import User


def home(request):
    groups = Group.objects.order_by('-id')
    my_groups = []
    my_groups_topics = []
    my_groups_comments = []
    last_topics = Topic.objects.order_by('-id')[:20]
    last_join_users = User.objects.order_by('-id')[:20]
    last_comments = Comment.objects.order_by('-id')[:20]
    if request.user.is_authenticated:
        my_groups = request.user.groupmember_set.order_by('-id')
        my_groups_topics = Topic.objects.filter(group__in=my_groups.values('group_id')).order_by('-id')[:20]
        my_groups_comments = Comment.objects.filter(topic__group__in=my_groups.values('group_id')).order_by('-id')[:20]

    return render(request, 'group/home.html', {
            'groups_lists': [([g.group for g in my_groups], '我加入的小组'), (groups, '全部小组')],
            'my_groups_topics': my_groups_topics, 'last_topics': last_topics,
            'my_groups_comments': my_groups_comments, 'last_comments': last_comments,
            'last_join_users': last_join_users,
    })
