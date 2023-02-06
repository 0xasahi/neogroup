from django import forms
from django.utils.translation import gettext_lazy as _
from group.models import Group, Topic, Comment
from markdownx.fields import MarkdownxFormField


class TopicForm(forms.ModelForm):
    class Meta:
        model = Topic
        fields = ('id', 'title', 'description')
    title = forms.CharField(max_length=255, required=True, widget=forms.TextInput(attrs={'placeholder': _('添加标题')}))
    description = MarkdownxFormField(required=True)
    id = forms.IntegerField(required=False)
    share_to_mastodon = forms.BooleanField(
        label=_("分享到联邦网络"), initial=True, required=False
    )


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ('id', 'content')
    content = forms.CharField(required=True, widget=forms.Textarea(attrs={"rows": 5}))
    id = forms.IntegerField(required=False)
    comment_reply = forms.IntegerField(required=False, widget=forms.HiddenInput)
    share_to_mastodon = forms.BooleanField(
        label=_("分享到联邦网络"), initial=True, required=False
    )


class GroupSettingsForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ('id', 'description', 'icon_url')
    description = forms.CharField(required=True, widget=forms.Textarea(attrs={"rows": 5}))
    id = forms.IntegerField(required=False, widget=forms.HiddenInput)
