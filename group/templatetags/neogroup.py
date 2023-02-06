from django import template
from group.models import LikeComment

register = template.Library()

@register.simple_tag(takes_context=True)
def is_like_comment(context, comment):
    user = context["request"].user
    if user and user.is_authenticated:
        return LikeComment.objects.filter(user=user, comment=comment).first() is not None
    return False