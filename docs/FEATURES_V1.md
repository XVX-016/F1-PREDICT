# F1-PREDICT ML Features (FROZEN V1)

> **Status**: FROZEN  
> **Version**: V1  
> **Effective**: 2026-01-17

---

## Feature Definitions

| # | Feature Name | Unit | Expected Range | Description |
|---|--------------|------|----------------|-------------|
| 1 | `avg_long_run_pace_ms` | ms | 85,000 - 95,000 | Mean clean lap time in FP2/FP3 |
| 2 | `tire_deg_rate` | ms/lap | 10 - 100 | Linear slope of lap times within stint |
| 3 | `sector_consistency` | ms (std) | 100 - 500 | Standard deviation of sector times |
| 4 | `clean_air_delta` | ms | -200 to 0 | Pace advantage in clean air vs traffic |
| 5 | `recent_form` | points | 0 - 26 | EWMA of championship points (last 5 races) |
| 6 | `grid_position` | position | 1 - 20 | Starting grid position |

---

## Enforcement

```python
EXPECTED_FEATURES = [
    "avg_long_run_pace_ms",
    "tire_deg_rate",
    "sector_consistency",
    "clean_air_delta",
    "recent_form",
    "grid_position",
]

# Validate at training time
assert list(X.columns) == EXPECTED_FEATURES, "Feature mismatch - version bump required"
```

---

## Change Policy

**No new features allowed without:**

1. Update to `debug_features.py` inspection
2. Baseline comparison showing improvement
3. Model version bump (e.g., V1 → V2)
4. Update to this document

---

## Rationale

Feature freeze prevents:
- Silent feature creep
- Training/inference mismatch
- Unvalidated complexity

This is an intentional constraint for credibility.
