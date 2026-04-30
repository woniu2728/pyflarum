from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from apps.core.release import ensure_release_versions_aligned  # noqa: E402


def main() -> int:
    try:
        state = ensure_release_versions_aligned(ROOT)
    except ValueError as exc:
        print(f"[ERROR] {exc}")
        return 1

    print("[OK] Release versions aligned")
    print(f"VERSION={state.version}")
    print(f"frontend/package.json={state.frontend_version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
