def fuel_time_penalty(
    initial_fuel: float,
    lap: int,
    burn_rate: float,
    k: float
) -> float:
    """
    Calculates the time penalty due to fuel weight.
    
    Formula: DeltaT_fuel(l) = k * fuel_remaining(l)
    
    Args:
        initial_fuel (float): Starting fuel load in kg.
        lap (int): Current lap number.
        burn_rate (float): Fuel consumption per lap (kg).
        k (float): Time penalty constant (seconds per kg of fuel).
        
    Returns:
        float: The calculated time penalty (added to lap time).
    """
    fuel_left = max(0, initial_fuel - lap * burn_rate)
    return k * fuel_left
