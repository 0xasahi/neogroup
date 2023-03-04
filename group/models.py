from django.db import models
from django.conf import settings
from django.urls import reverse
from users.models import User
from common.utils import GenerateDateUUIDMediaFilePath
from markdown import markdown
from group.schema import Groupchema, GroupMemberSchema, TopicSchema, UserSchema, CommentSchema


def group_image_path(instance, filename):
    return GenerateDateUUIDMediaFilePath(
        instance, filename, settings.GROUP_ICON_MEDIA_ROOT
    )


class SerializerMixin(object):
    def to_json(self, schema=None):
        Schema = schema or {
            "Group": Groupchema,
            "Topic": TopicSchema,
            "User": UserSchema,
            "Comment": CommentSchema,
            "GroupMember": GroupMemberSchema,
        }.get(self.__class__.__name__, lambda: {})

        return Schema().dump(self)


class Group(models.Model, SerializerMixin):
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

    @property
    def absolute_url(self):
        return settings.APP_WEBSITE + reverse("group:group", kwargs={"group_id": self.id})


class GroupMember(models.Model, SerializerMixin):
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


class Topic(models.Model, SerializerMixin):
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.IntegerField(default=0)  # 0 topic 1 question 2 poll
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

    def get_comments_dict(self, user, start=0, limit=10):
        comments = [c.to_json() for c in self.comment_set.order_by("id")[
            start:start + limit]]
        liked_comments = []
        if user and user.is_authenticated:
            liked_comments = LikeComment.get_liked_comments(
                [c['id'] for c in comments], user=user
            )
        for comment in comments:
            comment["liked"] = comment["id"] in liked_comments
            comment['is_owner'] = user and user.id == comment['user']['id']
        return comments

    @property
    def comments_count(self):
        return self.comment_set.count()


class Comment(models.Model, SerializerMixin):
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    comment_reply = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.content

    @property
    def absolute_url(self):
        return settings.APP_WEBSITE + reverse("group:topic", kwargs={"topic_id": self.topic.id}) + f"?comment_id={self.id}"

    @property
    def like_count(self):
        return LikeComment.objects.filter(comment=self).count()

    def is_liked_by(self, user):
        return LikeComment.is_liked(user, self)


class LikeComment(models.Model, SerializerMixin):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.comment.content

    @classmethod
    def is_liked(cls, user, comment):
        return cls.objects.filter(user=user, comment=comment).first() is not None

    @classmethod
    def get_liked_comments(cls, comment_ids, user):
        if not comment_ids or not user:
            return []
        return [l for l in cls.objects.filter(user=user, comment__in=comment_ids).values_list('comment', flat=True)]
