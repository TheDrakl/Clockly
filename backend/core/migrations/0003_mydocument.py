# Generated by Django 5.0.4 on 2025-07-21 16:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_chatsession_chatmessage'),
    ]

    operations = [
        migrations.CreateModel(
            name='MyDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(max_length=512)),
                ('content', models.TextField()),
                ('embedding', models.JSONField(blank=True, null=True)),
            ],
        ),
    ]
