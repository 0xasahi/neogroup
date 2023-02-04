from django.shortcuts import reverse, redirect, render, get_object_or_404
from django.http import HttpResponseBadRequest, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib import auth
from django.contrib.auth import authenticate
from django.core.paginator import Paginator
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count
from .models import User, Report
from .forms import ReportForm
from mastodon.api import *
from mastodon import mastodon_request_included
from common.config import *
from common.utils import PageLinksGenerator
from mastodon.models import MastodonApplication
from mastodon.api import verify_account
from django.conf import settings
from urllib.parse import quote
import django_rq
from .account import *
from .tasks import *
from datetime import timedelta
from django.utils import timezone
import json
from django.contrib import messages


@mastodon_request_included
@login_required
def data(request):
    return render(
        request,
        "users/data.html",
        {
            "allow_any_site": settings.MASTODON_ALLOW_ANY_SITE,
            "import_status": request.user.get_preference().import_status,
            "export_status": request.user.get_preference().export_status,
        },
    )


@login_required
def data_import_status(request):
    return render(
        request,
        "users/data_import_status.html",
        {
            "import_status": request.user.get_preference().import_status,
        },
    )


@mastodon_request_included
@login_required
def export_reviews(request):
    if request.method != "POST":
        return redirect(reverse("users:data"))
    return render(request, "users/data.html")


@mastodon_request_included
@login_required
def export_marks(request):
    if request.method == "POST":
        if not request.user.preference.export_status.get("marks_pending"):
            django_rq.get_queue("export").enqueue(export_marks_task, request.user)
            request.user.preference.export_status["marks_pending"] = True
            request.user.preference.save()
        messages.add_message(request, messages.INFO, _("导出已开始。"))
        return redirect(reverse("users:data"))
    else:
        try:
            with open(request.user.preference.export_status["marks_file"], "rb") as fh:
                response = HttpResponse(
                    fh.read(), content_type="application/vnd.ms-excel"
                )
                response["Content-Disposition"] = 'attachment;filename="marks.xlsx"'
                return response
        except Exception:
            messages.add_message(request, messages.ERROR, _("导出文件已过期，请重新导出"))
            return redirect(reverse("users:data"))


@login_required
def sync_mastodon(request):
    if request.method == "POST":
        django_rq.get_queue("mastodon").enqueue(
            refresh_mastodon_data_task, request.user
        )
        messages.add_message(request, messages.INFO, _("同步已开始。"))
    return redirect(reverse("users:data"))