from django.shortcuts import redirect, render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from group.models import Group, Topic, Comment, GroupMember


@login_required
def home(request):
    groups = Group.objects.order_by('-id')
    my_groups = []
    if request.user.is_authenticated:
        my_groups = request.user.groupmember_set.order_by('-id')
    return render(request, 'group/home.html', {'groups': groups, 'my_groups': my_groups})
