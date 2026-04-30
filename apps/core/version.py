from pathlib import Path


def _load_app_version() -> str:
    version_file = Path(__file__).resolve().parents[2] / "VERSION"
    try:
        value = version_file.read_text(encoding="utf-8").strip()
    except OSError:
        return "0.0.0-dev"
    return value or "0.0.0-dev"


APP_VERSION = _load_app_version()
