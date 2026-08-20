from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("searches", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="searchprofile",
            name="send_images",
            field=models.BooleanField(default=False),
        ),
    ]
