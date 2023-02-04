from django.urls import path
from .views import *

app_name = "users"
urlpatterns = [
    path("login/", login, name="login"),
    path("register/", register, name="register"),
    path("connect/", connect, name="connect"),
    path("reconnect/", reconnect, name="reconnect"),
    path("data/", data, name="data"),
    path("data/sync_mastodon", sync_mastodon, name="sync_mastodon"),
    path("data/clear_data", clear_data, name="clear_data"),
    path("logout/", logout, name="logout"),
    path("layout/", set_layout, name="set_layout"),
    path("OAuth2_login/", OAuth2_login, name="OAuth2_login"),
    path("<str:id>/followers/", followers, name="followers"),
    path("<str:id>/following/", following, name="following"),
    path("report/", report, name="report"),
    path("manage_report/", manage_report, name="manage_report"),
]
