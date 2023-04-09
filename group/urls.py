from django.urls import path
from group.views import *
from group.feeds import LatestTopicsFeed
from django.contrib.auth.decorators import login_required


app_name = "group"
urlpatterns = [
    path("create/", login_required(create), name="create"),
    path("<int:group_id>/new_topic", login_required(new_topic), name="new_topic"),
    path("<int:group_id>/join", j_login_required(join), name="join"),
    path("<int:group_id>/leave", j_login_required(leave), name="leave"),
    path("<int:group_id>/group_edit", login_required(group_edit), name="group_edit"),
    path("<int:group_id>/topics", get_topics, name="topics"),
    path("<int:group_id>/", group, name="group"),
    path("topic/<int:topic_id>/", topic, name="topic"),
    path("topic/<int:topic_id>/comments", get_comments, name="comments"),
    path("topic/<int:topic_id>/delete", delete_topic, name="delete_topic"),
    path("comment/<int:comment_id>/delete", delete_comment, name="delete_comment"),
    path("comment/<int:comment_id>/like", j_login_required(like_comment), name="like_comment"),
    path("profile/<str:mastodon_username>/", profile, name="profile"),
    path("<int:group_id>/feed/", LatestTopicsFeed(), name="feed"),
]