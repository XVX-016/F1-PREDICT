import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from services.simulation_cache import build_simulation_cache_key, normalize_simulation_request


def test_normalize_simulation_request_is_order_insensitive():
    payload_a = {
        "iterations": 500,
        "seed": 7,
        "use_ml": True,
        "params": {"focus_driver": "VER", "sc_probability": 0.1},
        "events": [{"type": "SC", "lap": 18, "intensity": 1.0}],
    }
    payload_b = {
        "events": [{"lap": 18, "intensity": 1.0, "type": "SC"}],
        "params": {"sc_probability": 0.1, "focus_driver": "VER"},
        "use_ml": True,
        "seed": 7,
        "iterations": 500,
    }

    assert normalize_simulation_request(payload_a) == normalize_simulation_request(payload_b)
    assert build_simulation_cache_key("bahrain", payload_a) == build_simulation_cache_key("bahrain", payload_b)


def test_cache_key_changes_when_request_changes():
    base = {
        "iterations": 500,
        "seed": 7,
        "use_ml": True,
        "params": {"focus_driver": "VER", "sc_probability": 0.1},
        "events": [],
    }
    variant = {
        **base,
        "params": {"focus_driver": "VER", "sc_probability": 0.15},
    }

    assert build_simulation_cache_key("bahrain", base) != build_simulation_cache_key("bahrain", variant)
