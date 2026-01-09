"""
Enhanced F1 Driver Database for 2025 Season
Comprehensive driver profiles with performance metrics, weather sensitivity,
track history, and current season form for all 20 drivers.
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class DriverProfile:
    """Comprehensive driver profile with all performance metrics"""
    driver_id: str
    name: str
    constructor: str
    constructor_id: str
    nationality: str
    age: int
    experience_years: int
    
    # Current season performance (2025)
    season_points: float
    current_position: int
    recent_form: float  # 0.5-1.5 scale
    
    # Driver tier classification
    driver_tier: str  # Elite, Strong, Midfield, Developing
    tier_multiplier: float  # Performance multiplier
    
    # Weather sensitivity (0.7-1.3 scale)
    weather_sensitivity: Dict[str, float]
    
    # Track type performance (0.8-1.2 scale)
    track_performance: Dict[str, float]
    
    # Historical performance (last 3 seasons)
    historical_points: List[float]
    historical_positions: List[int]
    
    # Team performance indicators
    team_strength: float  # 0.7-1.3 scale
    car_reliability: float  # 0.8-1.2 scale
    
    # Specialized skills
    qualifying_strength: float  # 0.7-1.3 scale
    race_pace: float  # 0.7-1.3 scale
    tire_management: float  # 0.7-1.3 scale
    wet_weather_skill: float  # 0.7-1.3 scale

# Comprehensive driver database for 2025 season
DRIVERS_2025 = {
    "VER": DriverProfile(
        driver_id="VER",
        name="Max Verstappen",
        constructor="Red Bull Racing",
        constructor_id="RBR",
        nationality="Dutch",
        age=27,
        experience_years=9,
        season_points=245.0,
        current_position=1,
        recent_form=1.15,
        driver_tier="Elite",
        tier_multiplier=1.25,
        weather_sensitivity={
            "dry": 1.20,
            "wet": 1.15,
            "intermediate": 1.18,
            "mixed": 1.16
        },
        track_performance={
            "street": 1.10,
            "high_speed": 1.20,
            "technical": 1.15,
            "permanent": 1.18
        },
        historical_points=[454.0, 395.0, 362.0],
        historical_positions=[1, 1, 1],
        team_strength=1.15,
        car_reliability=1.10,
        qualifying_strength=1.20,
        race_pace=1.25,
        tire_management=1.15,
        wet_weather_skill=1.20
    ),
    
    "NOR": DriverProfile(
        driver_id="NOR",
        name="Lando Norris",
        constructor="McLaren-Mercedes",
        constructor_id="MCL",
        nationality="British",
        age=25,
        experience_years=6,
        season_points=198.0,
        current_position=2,
        recent_form=1.35,  # McLaren dominance
        driver_tier="Elite",
        tier_multiplier=1.35,
        weather_sensitivity={
            "dry": 1.25,
            "wet": 1.20,
            "intermediate": 1.22,
            "mixed": 1.23
        },
        track_performance={
            "street": 1.25,
            "high_speed": 1.20,
            "technical": 1.30,
            "permanent": 1.22
        },
        historical_points=[205.0, 122.0, 160.0],
        historical_positions=[6, 11, 7],
        team_strength=1.25,
        car_reliability=1.15,
        qualifying_strength=1.25,
        race_pace=1.30,
        tire_management=1.20,
        wet_weather_skill=1.25
    ),
    
    "PIA": DriverProfile(
        driver_id="PIA",
        name="Oscar Piastri",
        constructor="McLaren-Mercedes",
        constructor_id="MCL",
        nationality="Australian",
        age=24,
        experience_years=2,
        season_points=185.0,
        current_position=3,
        recent_form=1.30,
        driver_tier="Elite",
        tier_multiplier=1.30,
        weather_sensitivity={
            "dry": 1.20,
            "wet": 1.15,
            "intermediate": 1.18,
            "mixed": 1.16
        },
        track_performance={
            "street": 1.20,
            "high_speed": 1.15,
            "technical": 1.25,
            "permanent": 1.18
        },
        historical_points=[97.0, 0.0, 0.0],
        historical_positions=[9, 0, 0],
        team_strength=1.25,
        car_reliability=1.15,
        qualifying_strength=1.20,
        race_pace=1.25,
        tire_management=1.15,
        wet_weather_skill=1.20
    ),
    
    "LEC": DriverProfile(
        driver_id="LEC",
        name="Charles Leclerc",
        constructor="Ferrari",
        constructor_id="FER",
        nationality="Monegasque",
        age=27,
        experience_years=7,
        season_points=178.0,
        current_position=4,
        recent_form=1.20,
        driver_tier="Elite",
        tier_multiplier=1.20,
        weather_sensitivity={
            "dry": 1.15,
            "wet": 1.10,
            "intermediate": 1.12,
            "mixed": 1.13
        },
        track_performance={
            "street": 1.15,
            "high_speed": 1.10,
            "technical": 1.20,
            "permanent": 1.12
        },
        historical_points=[206.0, 159.0, 308.0],
        historical_positions=[5, 7, 2],
        team_strength=1.10,
        car_reliability=1.05,
        qualifying_strength=1.25,
        race_pace=1.15,
        tire_management=1.10,
        wet_weather_skill=1.15
    ),
    
    "HAM": DriverProfile(
        driver_id="HAM",
        name="Lewis Hamilton",
        constructor="Ferrari",
        constructor_id="FER",
        nationality="British",
        age=40,
        experience_years=17,
        season_points=165.0,
        current_position=5,
        recent_form=1.15,
        driver_tier="Elite",
        tier_multiplier=1.15,
        weather_sensitivity={
            "dry": 1.20,
            "wet": 1.25,
            "intermediate": 1.22,
            "mixed": 1.23
        },
        track_performance={
            "street": 1.20,
            "high_speed": 1.15,
            "technical": 1.25,
            "permanent": 1.18
        },
        historical_points=[234.0, 240.0, 387.0],
        historical_positions=[6, 6, 3],
        team_strength=1.10,
        car_reliability=1.05,
        qualifying_strength=1.20,
        race_pace=1.15,
        tire_management=1.25,
        wet_weather_skill=1.30
    ),
    
    "RUS": DriverProfile(
        driver_id="RUS",
        name="George Russell",
        constructor="Mercedes",
        constructor_id="MER",
        nationality="British",
        age=26,
        experience_years=5,
        season_points=158.0,
        current_position=6,
        recent_form=1.10,
        driver_tier="Strong",
        tier_multiplier=1.10,
        weather_sensitivity={
            "dry": 1.10,
            "wet": 1.05,
            "intermediate": 1.08,
            "mixed": 1.06
        },
        track_performance={
            "street": 1.10,
            "high_speed": 1.15,
            "technical": 1.12,
            "permanent": 1.08
        },
        historical_points=[175.0, 159.0, 275.0],
        historical_positions=[8, 8, 4],
        team_strength=1.05,
        car_reliability=1.10,
        qualifying_strength=1.15,
        race_pace=1.10,
        tire_management=1.08,
        wet_weather_skill=1.12
    ),
    
    "SAI": DriverProfile(
        driver_id="SAI",
        name="Carlos Sainz",
        constructor="Ferrari",
        constructor_id="FER",
        nationality="Spanish",
        age=30,
        experience_years=9,
        season_points=152.0,
        current_position=7,
        recent_form=1.10,
        driver_tier="Strong",
        tier_multiplier=1.10,
        weather_sensitivity={
            "dry": 1.10,
            "wet": 1.05,
            "intermediate": 1.08,
            "mixed": 1.06
        },
        track_performance={
            "street": 1.08,
            "high_speed": 1.12,
            "technical": 1.15,
            "permanent": 1.10
        },
        historical_points=[200.0, 164.0, 246.0],
        historical_positions=[7, 5, 5],
        team_strength=1.10,
        car_reliability=1.05,
        qualifying_strength=1.12,
        race_pace=1.10,
        tire_management=1.15,
        wet_weather_skill=1.08
    ),
    
    "ALO": DriverProfile(
        driver_id="ALO",
        name="Fernando Alonso",
        constructor="Aston Martin",
        constructor_id="AST",
        nationality="Spanish",
        age=43,
        experience_years=22,
        season_points=145.0,
        current_position=8,
        recent_form=1.05,
        driver_tier="Strong",
        tier_multiplier=1.05,
        weather_sensitivity={
            "dry": 1.15,
            "wet": 1.20,
            "intermediate": 1.18,
            "mixed": 1.16
        },
        track_performance={
            "street": 1.12,
            "high_speed": 1.08,
            "technical": 1.15,
            "permanent": 1.10
        },
        historical_points=[206.0, 206.0, 206.0],
        historical_positions=[4, 4, 4],
        team_strength=1.00,
        car_reliability=1.00,
        qualifying_strength=1.15,
        race_pace=1.10,
        tire_management=1.20,
        wet_weather_skill=1.25
    ),
    
    "STR": DriverProfile(
        driver_id="STR",
        name="Lance Stroll",
        constructor="Aston Martin",
        constructor_id="AST",
        nationality="Canadian",
        age=26,
        experience_years=7,
        season_points=138.0,
        current_position=9,
        recent_form=1.00,
        driver_tier="Midfield",
        tier_multiplier=1.00,
        weather_sensitivity={
            "dry": 1.00,
            "wet": 1.05,
            "intermediate": 1.02,
            "mixed": 1.03
        },
        track_performance={
            "street": 1.05,
            "high_speed": 1.00,
            "technical": 1.02,
            "permanent": 1.00
        },
        historical_points=[74.0, 18.0, 74.0],
        historical_positions=[10, 18, 10],
        team_strength=1.00,
        car_reliability=1.00,
        qualifying_strength=1.00,
        race_pace=1.00,
        tire_management=0.95,
        wet_weather_skill=1.05
    ),
    
    "GAS": DriverProfile(
        driver_id="GAS",
        name="Pierre Gasly",
        constructor="Alpine",
        constructor_id="ALP",
        nationality="French",
        age=29,
        experience_years=8,
        season_points=132.0,
        current_position=10,
        recent_form=1.00,
        driver_tier="Midfield",
        tier_multiplier=1.00,
        weather_sensitivity={
            "dry": 1.00,
            "wet": 1.05,
            "intermediate": 1.02,
            "mixed": 1.03
        },
        track_performance={
            "street": 1.02,
            "high_speed": 1.05,
            "technical": 1.08,
            "permanent": 1.00
        },
        historical_points=[62.0, 23.0, 62.0],
        historical_positions=[11, 14, 11],
        team_strength=0.95,
        car_reliability=0.95,
        qualifying_strength=1.05,
        race_pace=1.00,
        tire_management=1.00,
        wet_weather_skill=1.05
    ),
    
    "OCO": DriverProfile(
        driver_id="OCO",
        name="Esteban Ocon",
        constructor="Alpine",
        constructor_id="ALP",
        nationality="French",
        age=28,
        experience_years=7,
        season_points=128.0,
        current_position=11,
        recent_form=0.95,
        driver_tier="Midfield",
        tier_multiplier=0.95,
        weather_sensitivity={
            "dry": 0.95,
            "wet": 1.00,
            "intermediate": 0.98,
            "mixed": 0.97
        },
        track_performance={
            "street": 1.00,
            "high_speed": 1.02,
            "technical": 1.05,
            "permanent": 0.98
        },
        historical_points=[58.0, 92.0, 58.0],
        historical_positions=[12, 8, 12],
        team_strength=0.95,
        car_reliability=0.95,
        qualifying_strength=1.00,
        race_pace=0.95,
        tire_management=1.00,
        wet_weather_skill=1.00
    ),
    
    "ALB": DriverProfile(
        driver_id="ALB",
        name="Alexander Albon",
        constructor="Williams",
        constructor_id="WIL",
        nationality="Thai",
        age=28,
        experience_years=6,
        season_points=122.0,
        current_position=12,
        recent_form=0.95,
        driver_tier="Midfield",
        tier_multiplier=0.95,
        weather_sensitivity={
            "dry": 0.95,
            "wet": 1.00,
            "intermediate": 0.98,
            "mixed": 0.97
        },
        track_performance={
            "street": 0.98,
            "high_speed": 1.02,
            "technical": 1.00,
            "permanent": 0.95
        },
        historical_points=[27.0, 4.0, 27.0],
        historical_positions=[13, 19, 13],
        team_strength=0.90,
        car_reliability=0.90,
        qualifying_strength=0.95,
        race_pace=0.95,
        tire_management=0.95,
        wet_weather_skill=1.00
    ),
    
    "TSU": DriverProfile(
        driver_id="TSU",
        name="Yuki Tsunoda",
        constructor="Racing Bulls",
        constructor_id="RB",
        nationality="Japanese",
        age=24,
        experience_years=4,
        season_points=118.0,
        current_position=13,
        recent_form=0.95,
        driver_tier="Midfield",
        tier_multiplier=0.95,
        weather_sensitivity={
            "dry": 0.95,
            "wet": 1.00,
            "intermediate": 0.98,
            "mixed": 0.97
        },
        track_performance={
            "street": 1.00,
            "high_speed": 0.98,
            "technical": 1.02,
            "permanent": 0.95
        },
        historical_points=[17.0, 6.0, 17.0],
        historical_positions=[14, 17, 14],
        team_strength=0.90,
        car_reliability=0.90,
        qualifying_strength=0.95,
        race_pace=0.95,
        tire_management=0.95,
        wet_weather_skill=1.00
    ),
    
    "HUL": DriverProfile(
        driver_id="HUL",
        name="Nico Hulkenberg",
        constructor="Sauber",
        constructor_id="SAU",
        nationality="German",
        age=37,
        experience_years=14,
        season_points=112.0,
        current_position=14,
        recent_form=0.90,
        driver_tier="Midfield",
        tier_multiplier=0.90,
        weather_sensitivity={
            "dry": 0.90,
            "wet": 0.95,
            "intermediate": 0.92,
            "mixed": 0.93
        },
        track_performance={
            "street": 0.95,
            "high_speed": 0.98,
            "technical": 1.00,
            "permanent": 0.90
        },
        historical_points=[9.0, 0.0, 9.0],
        historical_positions=[16, 0, 16],
        team_strength=0.85,
        car_reliability=0.85,
        qualifying_strength=0.90,
        race_pace=0.90,
        tire_management=0.90,
        wet_weather_skill=0.95
    ),
    
    "LAW": DriverProfile(
        driver_id="LAW",
        name="Liam Lawson",
        constructor="Racing Bulls",
        constructor_id="RB",
        nationality="New Zealander",
        age=23,
        experience_years=1,
        season_points=108.0,
        current_position=15,
        recent_form=0.90,
        driver_tier="Developing",
        tier_multiplier=0.90,
        weather_sensitivity={
            "dry": 0.90,
            "wet": 0.95,
            "intermediate": 0.92,
            "mixed": 0.93
        },
        track_performance={
            "street": 0.92,
            "high_speed": 0.95,
            "technical": 0.98,
            "permanent": 0.88
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=0.90,
        car_reliability=0.90,
        qualifying_strength=0.85,
        race_pace=0.90,
        tire_management=0.85,
        wet_weather_skill=0.90
    ),
    
    "HAD": DriverProfile(
        driver_id="HAD",
        name="Isack Hadjar",
        constructor="Racing Bulls",
        constructor_id="RB",
        nationality="French",
        age=20,
        experience_years=1,
        season_points=102.0,
        current_position=16,
        recent_form=0.85,
        driver_tier="Developing",
        tier_multiplier=0.85,
        weather_sensitivity={
            "dry": 0.85,
            "wet": 0.90,
            "intermediate": 0.87,
            "mixed": 0.88
        },
        track_performance={
            "street": 0.88,
            "high_speed": 0.92,
            "technical": 0.95,
            "permanent": 0.85
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=0.90,
        car_reliability=0.90,
        qualifying_strength=0.80,
        race_pace=0.85,
        tire_management=0.80,
        wet_weather_skill=0.85
    ),
    
    "ANT": DriverProfile(
        driver_id="ANT",
        name="Andrea Kimi Antonelli",
        constructor="Mercedes",
        constructor_id="MER",
        nationality="Italian",
        age=18,
        experience_years=0,
        season_points=98.0,
        current_position=17,
        recent_form=0.80,
        driver_tier="Developing",
        tier_multiplier=0.80,
        weather_sensitivity={
            "dry": 0.80,
            "wet": 0.85,
            "intermediate": 0.82,
            "mixed": 0.83
        },
        track_performance={
            "street": 0.85,
            "high_speed": 0.88,
            "technical": 0.90,
            "permanent": 0.80
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=1.05,
        car_reliability=1.10,
        qualifying_strength=0.75,
        race_pace=0.80,
        tire_management=0.75,
        wet_weather_skill=0.80
    ),
    
    "BEA": DriverProfile(
        driver_id="BEA",
        name="Oliver Bearman",
        constructor="Haas",
        constructor_id="HAA",
        nationality="British",
        age=20,
        experience_years=1,
        season_points=95.0,
        current_position=18,
        recent_form=0.80,
        driver_tier="Developing",
        tier_multiplier=0.80,
        weather_sensitivity={
            "dry": 0.80,
            "wet": 0.85,
            "intermediate": 0.82,
            "mixed": 0.83
        },
        track_performance={
            "street": 0.85,
            "high_speed": 0.88,
            "technical": 0.90,
            "permanent": 0.80
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=0.85,
        car_reliability=0.85,
        qualifying_strength=0.75,
        race_pace=0.80,
        tire_management=0.75,
        wet_weather_skill=0.80
    ),
    
    "BOR": DriverProfile(
        driver_id="BOR",
        name="Gabriel Bortoleto",
        constructor="Sauber",
        constructor_id="SAU",
        nationality="Brazilian",
        age=20,
        experience_years=1,
        season_points=92.0,
        current_position=19,
        recent_form=0.75,
        driver_tier="Developing",
        tier_multiplier=0.75,
        weather_sensitivity={
            "dry": 0.75,
            "wet": 0.80,
            "intermediate": 0.77,
            "mixed": 0.78
        },
        track_performance={
            "street": 0.78,
            "high_speed": 0.82,
            "technical": 0.85,
            "permanent": 0.75
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=0.85,
        car_reliability=0.85,
        qualifying_strength=0.70,
        race_pace=0.75,
        tire_management=0.70,
        wet_weather_skill=0.75
    ),
    
    "COL": DriverProfile(
        driver_id="COL",
        name="Franco Colapinto",
        constructor="Alpine",
        constructor_id="ALP",
        nationality="Argentine",
        age=21,
        experience_years=1,
        season_points=88.0,
        current_position=20,
        recent_form=0.75,
        driver_tier="Developing",
        tier_multiplier=0.75,
        weather_sensitivity={
            "dry": 0.75,
            "wet": 0.80,
            "intermediate": 0.77,
            "mixed": 0.78
        },
        track_performance={
            "street": 0.78,
            "high_speed": 0.82,
            "technical": 0.85,
            "permanent": 0.75
        },
        historical_points=[0.0, 0.0, 0.0],
        historical_positions=[0, 0, 0],
        team_strength=0.95,
        car_reliability=0.95,
        qualifying_strength=0.70,
        race_pace=0.75,
        tire_management=0.70,
        wet_weather_skill=0.75
    )
}

# Team performance database
TEAMS_2025 = {
    "McLaren-Mercedes": {
        "strength": 1.25,
        "reliability": 1.15,
        "aero_efficiency": 1.20,
        "chassis_balance": 1.25,
        "power_unit": 1.15,
        "tire_management": 1.20,
        "pit_stop_efficiency": 1.15,
        "strategy_team": 1.20
    },
    "Red Bull Racing": {
        "strength": 1.15,
        "reliability": 1.10,
        "aero_efficiency": 1.25,
        "chassis_balance": 1.15,
        "power_unit": 1.10,
        "tire_management": 1.15,
        "pit_stop_efficiency": 1.20,
        "strategy_team": 1.25
    },
    "Ferrari": {
        "strength": 1.10,
        "reliability": 1.05,
        "aero_efficiency": 1.15,
        "chassis_balance": 1.10,
        "power_unit": 1.15,
        "tire_management": 1.10,
        "pit_stop_efficiency": 1.15,
        "strategy_team": 1.10
    },
    "Mercedes": {
        "strength": 1.05,
        "reliability": 1.10,
        "aero_efficiency": 1.10,
        "chassis_balance": 1.05,
        "power_unit": 1.20,
        "tire_management": 1.05,
        "pit_stop_efficiency": 1.10,
        "strategy_team": 1.15
    },
    "Aston Martin": {
        "strength": 1.00,
        "reliability": 1.00,
        "aero_efficiency": 1.00,
        "chassis_balance": 1.00,
        "power_unit": 1.00,
        "tire_management": 1.00,
        "pit_stop_efficiency": 1.00,
        "strategy_team": 1.00
    },
    "Alpine": {
        "strength": 0.95,
        "reliability": 0.95,
        "aero_efficiency": 0.95,
        "chassis_balance": 0.95,
        "power_unit": 0.95,
        "tire_management": 0.95,
        "pit_stop_efficiency": 0.95,
        "strategy_team": 0.95
    },
    "Racing Bulls": {
        "strength": 0.90,
        "reliability": 0.90,
        "aero_efficiency": 0.90,
        "chassis_balance": 0.90,
        "power_unit": 0.90,
        "tire_management": 0.90,
        "pit_stop_efficiency": 0.90,
        "strategy_team": 0.90
    },
    "Williams": {
        "strength": 0.90,
        "reliability": 0.90,
        "aero_efficiency": 0.90,
        "chassis_balance": 0.90,
        "power_unit": 0.90,
        "tire_management": 0.90,
        "pit_stop_efficiency": 0.90,
        "strategy_team": 0.90
    },
    "Sauber": {
        "strength": 0.85,
        "reliability": 0.85,
        "aero_efficiency": 0.85,
        "chassis_balance": 0.85,
        "power_unit": 0.85,
        "tire_management": 0.85,
        "pit_stop_efficiency": 0.85,
        "strategy_team": 0.85
    },
    "Haas": {
        "strength": 0.85,
        "reliability": 0.85,
        "aero_efficiency": 0.85,
        "chassis_balance": 0.85,
        "power_unit": 0.85,
        "tire_management": 0.85,
        "pit_stop_efficiency": 0.85,
        "strategy_team": 0.85
    }
}

# Track type performance database
TRACK_PERFORMANCE = {
    "street": {
        "description": "Street circuits with tight corners and low grip",
        "favors": ["McLaren-Mercedes", "Ferrari", "Aston Martin"],
        "disadvantages": ["Haas", "Sauber"],
        "key_factors": ["chassis_balance", "tire_management", "driver_skill"]
    },
    "high_speed": {
        "description": "High-speed circuits with long straights and fast corners",
        "favors": ["Red Bull Racing", "Mercedes", "McLaren-Mercedes"],
        "disadvantages": ["Williams", "Haas"],
        "key_factors": ["aero_efficiency", "power_unit", "top_speed"]
    },
    "technical": {
        "description": "Technical circuits with complex corner sequences",
        "favors": ["McLaren-Mercedes", "Ferrari", "Red Bull Racing"],
        "disadvantages": ["Haas", "Sauber"],
        "key_factors": ["chassis_balance", "driver_skill", "tire_management"]
    },
    "permanent": {
        "description": "Permanent racing circuits with mixed characteristics",
        "favors": ["McLaren-Mercedes", "Red Bull Racing", "Ferrari"],
        "disadvantages": ["Haas", "Sauber"],
        "key_factors": ["overall_balance", "reliability", "strategy"]
    }
}

# Weather impact database
WEATHER_IMPACT = {
    "dry": {
        "description": "Dry conditions with optimal grip",
        "favors": ["Red Bull Racing", "McLaren-Mercedes"],
        "disadvantages": ["Haas", "Sauber"],
        "impact_factors": ["tire_management", "aero_efficiency", "driver_skill"]
    },
    "wet": {
        "description": "Wet conditions with reduced grip",
        "favors": ["McLaren-Mercedes", "Ferrari"],
        "disadvantages": ["Haas", "Sauber"],
        "impact_factors": ["driver_skill", "chassis_balance", "tire_management"]
    },
    "intermediate": {
        "description": "Mixed conditions with variable grip",
        "favors": ["McLaren-Mercedes", "Red Bull Racing"],
        "disadvantages": ["Haas", "Sauber"],
        "impact_factors": ["driver_adaptability", "tire_management", "strategy"]
    },
    "mixed": {
        "description": "Variable conditions throughout the race",
        "favors": ["McLaren-Mercedes", "Ferrari"],
        "disadvantages": ["Haas", "Sauber"],
        "impact_factors": ["strategy", "driver_adaptability", "team_communication"]
    }
}

# Export functions for easy access
def get_driver_profile(driver_id: str) -> DriverProfile:
    """Get driver profile by ID"""
    return DRIVERS_2025.get(driver_id)

def get_all_drivers() -> Dict[str, DriverProfile]:
    """Get all driver profiles"""
    return DRIVERS_2025

def get_team_performance(team_name: str) -> Dict[str, float]:
    """Get team performance metrics"""
    return TEAMS_2025.get(team_name, {})

def get_track_performance(track_type: str) -> Dict[str, Any]:
    """Get track type performance characteristics"""
    return TRACK_PERFORMANCE.get(track_type, {})

def get_weather_impact(weather_condition: str) -> Dict[str, Any]:
    """Get weather impact characteristics"""
    return WEATHER_IMPACT.get(weather_condition, {})

def get_driver_list() -> List[str]:
    """Get list of all driver IDs"""
    return list(DRIVERS_2025.keys())

def get_team_list() -> List[str]:
    """Get list of all team names"""
    return list(TEAMS_2025.keys())
