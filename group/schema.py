from marshmallow import Schema as RootSchema, fields


class Schema(RootSchema):
    class Meta:
        datetimeformat = '%Y-%m-%d %H:%M:%S'


class UserSchema(Schema):
    id = fields.Int()
    following = fields.Raw()
    mastodon_id = fields.Str()
    mastodon_site = fields.Str()
    mastodon_token = fields.Str()
    mastodon_refresh_token = fields.Str()
    mastodon_locked = fields.Bool()
    mastodon_followers = fields.Raw()
    mastodon_following = fields.Raw()
    mastodon_mutes = fields.Raw()
    mastodon_blocks = fields.Raw()
    mastodon_domain_blocks = fields.Raw()
    mastodon_account = fields.Raw()
    mastodon_last_refresh = fields.DateTime()
    read_announcement_index = fields.Int()
    mastodon_username = fields.Str()


class Groupchema(Schema):
    id = fields.Int()
    user = fields.Nested(UserSchema)
    name = fields.Str()
    description = fields.Str()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    icon_url = fields.Str()
    absolute_url = fields.Str()


class TopicSchema(Schema):
    id = fields.Int()
    group = fields.Nested(Groupchema)
    user = fields.Nested(UserSchema)
    title = fields.Str()
    description = fields.Str()
    type = fields.Int()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    absolute_url = fields.Str()
    html_content = fields.Str()
    comments_count = fields.Int()


class BaseCommentSchema(Schema):
    id = fields.Int()
    user = fields.Nested(UserSchema)
    content = fields.Str()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    absolute_url = fields.Str()
    like_count = fields.Int()
    is_liked = fields.Bool()


class CommentSchema(BaseCommentSchema):
    comment_reply = fields.Nested(BaseCommentSchema)


class GroupMemberSchema(Schema):
    user = fields.Nested(UserSchema)
    group = fields.Nested(Groupchema)
    join_reason = fields.Str()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
