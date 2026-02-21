# Rigorous Engine Governance

## Purpose
This project treats the rigorous simulation engine as a governed decision system, not a visual-only feature.
Changes to model behavior must satisfy reproducibility, runtime, and convergence constraints.

## Validation Gate
Primary command:

```bash
npm run rigorous:validate
```

This runs:
- Backtest with calibrated parameter set
- Reproducibility checks
- Runtime threshold checks
- Convergence drift checks
- Frontend smoke/typecheck pipeline

## Current Threshold Policy
- `require_reproducible`: enabled
- `max_runtime_ms`: `900`
- `max_convergence_l1` (`250_vs_target`): `0.25`

These values are encoded in `package.json` under `rigorous:validate`.

## Calibration Cycle
Run calibration:

```bash
npm run rigorous:calibrate
```

Artifacts generated:
- `backend/data/rigorous_model_params.v1.calibrated.json`
- `backend/reports/rigorous_calibration_report.json`

The backend prefers calibrated params by default:
1. `backend/data/rigorous_model_params.v1.calibrated.json`
2. `backend/data/rigorous_model_params.v1.json`

## CI Policy
Workflow: `.github/workflows/smoke-pipelines.yml`

Required checks:
- `backend/tests/unit/test_rigorous_engine.py`
- `npm run rigorous:validate`
- `npm run smoke:pipelines`

If any check fails, the pipeline must fail.

## Change Management Rules
- Do not modify core rigorous coefficients without:
  - A calibration report
  - A successful rigorous validation report
- Every model change should include parameter signature comparison before/after.
- New metrics exposed to UI must originate from backend contracts, not frontend recomputation.
