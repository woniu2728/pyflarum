from django.conf import settings
from django.test.runner import DiscoverRunner


class BiasDiscoverRunner(DiscoverRunner):
    """Ensure `manage.py test` loads app test modules even without explicit labels."""

    def build_suite(self, test_labels=None, *args, **kwargs):
        if not test_labels:
            test_labels = [
                f"{app}.tests"
                for app in settings.INSTALLED_APPS
                if app.startswith("apps.")
            ]
        return super().build_suite(test_labels, *args, **kwargs)
