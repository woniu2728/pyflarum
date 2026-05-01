from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_initial"),
        ("discussions", "0003_discussion_approval_status"),
        ("posts", "0004_post_approval_status"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
