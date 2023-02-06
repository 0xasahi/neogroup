# Generated by Django 4.1.5 on 2023-02-06 09:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("group", "0002_alter_group_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="comment",
            name="comment_reply",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="group.comment",
            ),
        ),
    ]