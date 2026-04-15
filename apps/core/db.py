import time
from functools import wraps

from django.db import OperationalError, close_old_connections


SQLITE_LOCKED_MESSAGE = "database is locked"


def sqlite_write_retry(attempts: int = 4, delay: float = 0.1, backoff: float = 2.0):
    """Retry short-lived SQLite write conflicts in local development."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay

            for attempt in range(attempts):
                try:
                    return func(*args, **kwargs)
                except OperationalError as exc:
                    message = str(exc).lower()
                    is_locked = SQLITE_LOCKED_MESSAGE in message
                    if not is_locked or attempt == attempts - 1:
                        raise

                    close_old_connections()
                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper

    return decorator
