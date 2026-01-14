import math

def tyre_lap_time(
    base_time: float,
    tyre_age: int,
    alpha: float,
    beta: float,
    gamma: float,
) -> float:
    """
    Calculates the lap time based on tyre age using a combined linear and exponential decay model.
    
    Formula: LapTime(a) = T0 + alpha * a + beta * (1 - e^(-gamma * a))
    
    Args:
        base_time (float): The fundamental lap time (T0) on fresh tyres.
        tyre_age (int): Number of laps completed on the current set of tyres.
        alpha (float): Linear degradation coefficient (seconds per lap).
        beta (float): Exponential decay amplitude (seconds).
        gamma (float): Exponential decay rate constant (per lap).
        
    Returns:
        float: The calculated lap time.
    """
    return base_time + alpha * tyre_age + beta * (1 - math.exp(-gamma * tyre_age))
