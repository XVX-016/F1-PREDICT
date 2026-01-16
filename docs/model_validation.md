# Simulation Model Validation

## Methodology
The F1-PREDICT Simulation Engine (v2.5.0) uses a dual-layer approach to race strategy analysis.

### 1. Deterministic Physics Layer
- **Tyre Degradation**: Modeled as an exponential decay function based on lap count and compound coefficients. The `tyre_deg_multiplier` slider allows sensitivity testing for abrasive tracks or unusual thermal conditions.
- **Fuel Burn**: Linear time advantage scale (~0.03s per lap) as fuel weight decreases.
- **Pit Loss**: Fixed delta overhead per track geometry.

### 2. Stochastic Monte Carlo Layer
- **Sampling**: N=10,000 iterations per session.
- **Driver Variance**: Gaussian noise applied to base pace to represent consistency.
- **Race Events**: Safety Car (SC) and Virtual Safety Car (VSC) windows are sampled based on historical track probability and user-defined `sc_probability`.

## Validation Results

### Sanity Checks
1. **Monotonicity**: Lap times must increase with tyre age (holding fuel constant). **[PASS]**
2. **Compound Delta**: Soft compounds must show initial pace advantage over Medium/Hard. **[PASS]**
3. **Probability Sum**: Total win probability across field Σ P = 1.0. **[PASS]**
4. **Reproducibility**: Identical seeds must yield bit-perfect result parity. **[PASS]**

## Limitations
- **Traffic Modeling**: Currently uses a simplified 'blue flag' penalty rather than full field interaction.
- **Weather Transition**: "Mixed" weather assumes a single transition point rather than complex track drying lines.
- **Mechanical DNF**: Modeled as a flat probability per driver, not correlated to engine age (yet).
