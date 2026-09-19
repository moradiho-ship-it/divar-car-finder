from django.db import migrations, models


def copy_existing_selections(apps, schema_editor):
    SearchProfile = apps.get_model("searches", "SearchProfile")
    for profile in SearchProfile.objects.only("id", "model", "trim").iterator():
        SearchProfile.objects.filter(pk=profile.pk).update(
            models=[profile.model] if profile.model else [],
            trims=[profile.trim] if profile.trim else [],
        )


class Migration(migrations.Migration):
    dependencies = [("searches", "0002_searchprofile_send_images")]

    operations = [
        migrations.AddField(
            model_name="searchprofile",
            name="models",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="searchprofile",
            name="trims",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(copy_existing_selections, migrations.RunPython.noop),
    ]
