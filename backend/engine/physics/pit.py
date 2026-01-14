def pit_loss(
    base_loss: float,
    traffic_penalty: float = 0.0
) -> float:
    """
    Calculates the total time lost during a pit stop.
    
    Formula: T_pit = T_lane + T_stop + T_traffic
    
    Args:
        base_loss (float): Combined lane entry/exit and wheel-change time.
        traffic_penalty (float): Additional delay caused by pit lane traffic or release safety.
        
    Returns:
        float: Total time lost in seconds.
    """
    return base_loss + traffic_penalty
