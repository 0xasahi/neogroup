from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse
from django.http import HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.utils.translation import gettext_lazy as _
from .models import User, Report
from .forms import ReportForm
from mastodon.api import *
from mastodon import mastodon_request_included
from common.config import *
from .account import *
from .data import *
import json


def render_user_not_found(request):
    msg = _("😖哎呀，这位用户还没有加入本站，快去联邦宇宙呼唤TA来注册吧！")
    sec_msg = _("")
    return render(
        request,
        "common/error.html",
        {
            "msg": msg,
            "secondary_msg": sec_msg,
        },
    )


def render_user_blocked(request):
    msg = _("你没有访问TA主页的权限😥")
    return render(
        request,
        "common/error.html",
        {
            "msg": msg,
        },
    )


@login_required
def followers(request, id):
    if request.method == "GET":
        user = User.get(id)
        if user is None or user != request.user:
            return render_user_not_found(request)
        return render(
            request,
            "users/relation_list.html",
            {
                "user": user,
                "is_followers_page": True,
            },
        )
    else:
        return HttpResponseBadRequest()


@login_required
def following(request, id):
    if request.method == "GET":
        user = User.get(id)
        if user is None or user != request.user:
            return render_user_not_found(request)
        return render(
            request,
            "users/relation_list.html",
            {
                "user": user,
                "page_type": "followers",
            },
        )
    else:
        return HttpResponseBadRequest()


@login_required
def set_layout(request):
    if request.method == "POST":
        layout = json.loads(request.POST.get("layout"))
        request.user.preference.profile_layout = layout
        request.user.preference.save()
        return redirect(
            reverse("journal:user_profile", args=[request.user.mastodon_username])
        )
    else:
        return HttpResponseBadRequest()


@login_required
def report(request):
    if request.method == "GET":
        user_id = request.GET.get("user_id")
        if user_id:
            user = get_object_or_404(User, pk=user_id)
            form = ReportForm(initial={"reported_user": user})
        else:
            form = ReportForm()
        return render(
            request,
            "users/report.html",
            {
                "form": form,
            },
        )
    elif request.method == "POST":
        form = ReportForm(request.POST)
        if form.is_valid():
            form.instance.is_read = False
            form.instance.submit_user = request.user
            form.save()
            return redirect(
                reverse(
                    "journal:user_profile",
                    args=[form.instance.reported_user.mastodon_username],
                )
            )
        else:
            return render(
                request,
                "users/report.html",
                {
                    "form": form,
                },
            )
    else:
        return HttpResponseBadRequest()


@login_required
def manage_report(request):
    if request.method == "GET":
        reports = Report.objects.all()
        for r in reports.filter(is_read=False):
            r.is_read = True
            r.save()
        return render(
            request,
            "users/manage_report.html",
            {
                "reports": reports,
            },
        )
    else:
        return HttpResponseBadRequest()
