
import os
import sys

# Ensure `backend/` is importable when pytest is launched from repo root in CI.
tests_dir = os.path.abspath(os.path.dirname(__file__))
backend_dir = os.path.abspath(os.path.join(tests_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
