from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Rss201rev2Feed
from django.urls import reverse
from group.models import Group


class CorrectMimeTypeFeed(Rss201rev2Feed):
    mime_type = 'application/xml'


class LatestTopicsFeed(Feed):
    language = "zh-cn"
    feed_type = CorrectMimeTypeFeed

    def get_object(self, request, group_id):
        return Group.objects.get(id=group_id)

    def title(self, obj):
        return obj.name

    def link(self, obj):
        return reverse("group:group", args=[obj.id])

    def description(self, obj):
        return obj.description

    def items(self, obj):
        return obj.topic_set.order_by("-created_at")[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.description

    def item_pubdate(self, item):
        return item.created_at

    def item_author_name(self, item):
        return item.user.mastodon_username

    def item_link(self, item):
        return reverse("group:topic", args=[item.id])