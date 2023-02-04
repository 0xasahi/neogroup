from django.urls import path
from group.views import *

app_name = "group"
urlpatterns = [
    path("create/", create, name="create"),
    path("<int:group_id>/new_topic", new_topic, name="new_topic"),
    path("<int:group_id>/join", join, name="join"),
    path("<int:group_id>/leave", leave, name="leave"),
    path("<int:group_id>/group_edit", group_edit, name="group_edit"),
    path("<int:group_id>/", group, name="group"),
    path("topic/<int:topic_id>/", topic, name="topic"),
    path("profile/<str:mastodon_username>/", profile, name="profile"),
]