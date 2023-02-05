from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from group.models import Group, Topic, Comment, GroupMember
from users.models import User


@login_required
def home(request):
    groups = Group.objects.order_by('-id')
    my_groups = []
    last_topics = Topic.objects.order_by('-id')[:20]
    last_join_users = User.objects.order_by('-id')[:20]
    if request.user.is_authenticated:
        my_groups = request.user.groupmember_set.order_by('-id')
    return render(request, 'group/home.html', {'groups': groups, 'my_groups': my_groups,
                                            'last_topics': last_topics, 'last_join_users': last_join_users})
