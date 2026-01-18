from typing import List, Dict, Any

def analyze_failure(trace: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Analyzes a race trace for deterministic strategy failures.
    
    Args:
        trace: List of LapState dictionaries.
        
    Returns:
        List of failure annotations.
    """
    failures = []
    
    # Thresholds (would normally be config)
    TYRE_CLIFF_LAP_MEDIUM = 25
    MIN_UNDERCUT_GAIN_MS = 0
    
    for i, lap in enumerate(trace):
        decision = lap.get("decision")
        car_state = lap.get("car_state", {})
        
        # 1. Negative Undercut Detection
        if decision and decision.get("action") == "PIT":
            metrics = decision.get("metrics", {})
            expected_gain = metrics.get("expected_gain_ms", 0)
            
            if expected_gain < MIN_UNDERCUT_GAIN_MS:
                failures.append({
                    "lap": lap["lap"],
                    "type": "NEGATIVE_UNDERCUT",
                    "severity": "HIGH",
                    "time_loss_ms": abs(expected_gain), # Simplified loss calc
                    "explanation": "Pit stop executed but fresh tyre gain did not offset pit loss"
                })

        # 2. Tyre Cliff Detection
        # Check if tyre age exceeded cliff and pace dropped (simplified check)
        tyre_age = car_state.get("tyre_age_laps", 0)
        compound = car_state.get("tyre_compound", "")
        
        if compound == "MEDIUM" and tyre_age > TYRE_CLIFF_LAP_MEDIUM:
             failures.append({
                "lap": lap["lap"],
                "type": "TYRE_CLIFF",
                "severity": "MEDIUM",
                "explanation": f"Tyre degradation exceeded modelled cliff ({TYRE_CLIFF_LAP_MEDIUM} laps) for MEDIUM compound"
            })
            
    return failures
