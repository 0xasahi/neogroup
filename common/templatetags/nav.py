from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def nav_items(context):
    user = context["request"].user
    nav_props = context.get("nav_props", {})
    items = [
        ['/', '首页'],
        ['https://neodb.social/', '书影音'],
        ['/group/create', '创建小组'],
    ]
    if user.is_authenticated:
        items.append(['/users/logout/', '登出'])
    else:
        items.append(['/users/login/?next=/home/', '登录'])

    nav_props.update(items=items)
    return nav_props
