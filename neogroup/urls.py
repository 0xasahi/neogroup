from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from users.views import login

urlpatterns = [
    path("admin/", admin.site.urls),
    path("login/", login),
    path("markdownx/", include("markdownx.urls")),
    path("users/", include("users.urls")),
    path("group/", include("group.urls")),
    path("", include("common.urls")),
    path("tz_detect/", include("tz_detect.urls")),
]

# if settings.DEBUG:
    # from django.conf.urls.static import static
    # urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()

    from django.conf.urls.static import static
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
