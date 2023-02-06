from django.db import models
from django.conf import settings
from django.urls import reverse
from users.models import User
from common.utils import GenerateDateUUIDMediaFilePath
from markdown import markdown


def group_image_path(instance, filename):
    return GenerateDateUUIDMediaFilePath(
        instance, filename, settings.GROUP_ICON_MEDIA_ROOT
    )

class Group(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    icon_url = models.ImageField(
        upload_to=group_image_path,
        height_field=None,
        width_field=None,
        blank=True,
        default="",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    join_reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.id

    @classmethod
    def is_member(cls, user, group):
        return cls.objects.filter(user=user, group=group).exists()


class Topic(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.IntegerField(default=0) # 0 topic 1 question 2 poll
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def absolute_url(self):
        return settings.APP_WEBSITE + reverse("group:topic", kwargs={"topic_id": self.id})

    @property
    def html_content(self):
        return markdown(self.description)


class Comment(models.Model):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    comment_reply = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.content

    @property
    def absolute_url(self):
        return settings.APP_WEBSITE + reverse("group:topic", kwargs={"topic_id": self.topic.id})