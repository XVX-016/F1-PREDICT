"""
Enhanced F1 Drivers Data for 2025 Season
Rich metadata including standings, form, track history, and constructor info.
"""

from typing import Dict, List, Any
from datetime import datetime

# 2025 F1 Driver Standings (simulated - will be updated with live data)
driver_standings = {
    "VER": 245.0,    # Max Verstappen
    "NOR": 198.0,    # Lando Norris
    "LEC": 185.0,    # Charles Leclerc
    "HAM": 178.0,    # Lewis Hamilton
    "RUS": 165.0,    # George Russell
    "PIA": 158.0,    # Oscar Piastri
    "SAI": 142.0,    # Carlos Sainz
    "ALO": 135.0,    # Fernando Alonso
    "STR": 98.0,     # Lance Stroll
    "GAS": 92.0,     # Pierre Gasly
    "OCO": 88.0,     # Esteban Ocon
    "ALB": 85.0,     # Alexander Albon
    "TSU": 82.0,     # Yuki Tsunoda
    "HUL": 78.0,     # Nico Hulkenberg
    "LAW": 72.0,     # Liam Lawson
    "HAD": 68.0,     # Isack Hadjar
    "ANT": 65.0,     # Kimi Antonelli
    "BEA": 62.0,     # Oliver Bearman
    "BOR": 58.0,     # Gabriel Bortoleto
    "COL": 55.0      # Franco Colapinto
}

# Recent Form Factors (>1.0 = good momentum, <1.0 = struggling)
recent_form = {
    "VER": 1.2,      # Strong recent performances
    "NOR": 1.3,      # Excellent recent form
    "LEC": 1.1,      # Good momentum
    "HAM": 1.0,      # Stable performance
    "RUS": 1.05,     # Slight improvement
    "PIA": 1.15,     # Good recent results
    "SAI": 0.95,     # Slight decline
    "ALO": 1.0,      # Consistent
    "STR": 0.9,      # Struggling
    "GAS": 1.05,     # Improving
    "OCO": 0.95,     # Inconsistent
    "ALB": 1.1,      # Good form
    "TSU": 1.0,      # Stable
    "HUL": 0.9,      # Struggling
    "LAW": 1.1,      # Rookie momentum
    "HAD": 1.05,     # Improving rookie
    "ANT": 1.0,      # Learning curve
    "BEA": 0.95,     # Rookie struggles
    "BOR": 0.9,      # Rookie learning
    "COL": 0.95      # Rookie adaptation
}

# Track History Performance Multipliers (per circuit)
track_history = {
    "VER": {  # Max Verstappen
        "monaco": 1.1, "baku": 1.0, "singapore": 1.05, "miami": 1.0,
        "spa": 1.2, "silverstone": 1.1, "monza": 1.0, "red_bull_ring": 1.15,
        "hungaroring": 1.1, "suzuka": 1.05, "interlagos": 1.0, "zandvoort": 1.2
    },
    "NOR": {  # Lando Norris
        "monaco": 1.0, "baku": 1.05, "singapore": 1.1, "miami": 1.05,
        "spa": 1.1, "silverstone": 1.15, "monza": 1.0, "red_bull_ring": 1.1,
        "hungaroring": 1.05, "suzuka": 1.1, "interlagos": 1.0, "zandvoort": 1.0
    },
    "LEC": {  # Charles Leclerc
        "monaco": 1.2, "baku": 1.1, "singapore": 1.0, "miami": 1.0,
        "spa": 1.1, "silverstone": 1.05, "monza": 1.15, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.05, "interlagos": 1.1, "zandvoort": 1.0
    },
    "HAM": {  # Lewis Hamilton
        "monaco": 1.15, "baku": 1.0, "singapore": 1.1, "miami": 1.05,
        "spa": 1.2, "silverstone": 1.2, "monza": 1.1, "red_bull_ring": 1.05,
        "hungaroring": 1.1, "suzuka": 1.0, "interlagos": 1.15, "zandvoort": 1.0
    },
    "RUS": {  # George Russell
        "monaco": 1.0, "baku": 1.05, "singapore": 1.0, "miami": 1.0,
        "spa": 1.1, "silverstone": 1.1, "monza": 1.05, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.05, "interlagos": 1.0, "zandvoort": 1.0
    },
    "PIA": {  # Oscar Piastri
        "monaco": 0.95, "baku": 1.0, "singapore": 1.05, "miami": 1.0,
        "spa": 1.05, "silverstone": 1.1, "monza": 1.0, "red_bull_ring": 1.05,
        "hungaroring": 1.0, "suzuka": 1.0, "interlagos": 0.95, "zandvoort": 1.0
    },
    "SAI": {  # Carlos Sainz
        "monaco": 1.0, "baku": 1.05, "singapore": 1.0, "miami": 1.0,
        "spa": 1.05, "silverstone": 1.0, "monza": 1.1, "red_bull_ring": 1.0,
        "hungaroring": 1.05, "suzuka": 1.0, "interlagos": 1.1, "zandvoort": 1.0
    },
    "ALO": {  # Fernando Alonso
        "monaco": 1.1, "baku": 1.0, "singapore": 1.05, "miami": 1.0,
        "spa": 1.15, "silverstone": 1.1, "monza": 1.05, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.05, "interlagos": 1.1, "zandvoort": 1.0
    },
    "STR": {  # Lance Stroll
        "monaco": 0.95, "baku": 1.0, "singapore": 0.95, "miami": 1.0,
        "spa": 1.0, "silverstone": 0.95, "monza": 1.0, "red_bull_ring": 0.95,
        "hungaroring": 0.95, "suzuka": 1.0, "interlagos": 0.95, "zandvoort": 1.0
    },
    "GAS": {  # Pierre Gasly
        "monaco": 1.0, "baku": 1.05, "singapore": 1.0, "miami": 1.0,
        "spa": 1.05, "silverstone": 1.0, "monza": 1.0, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.05, "interlagos": 1.0, "zandvoort": 1.0
    },
    "OCO": {  # Esteban Ocon
        "monaco": 1.0, "baku": 1.0, "singapore": 1.0, "miami": 1.0,
        "spa": 1.0, "silverstone": 1.0, "monza": 1.0, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.0, "interlagos": 1.0, "zandvoort": 1.0
    },
    "ALB": {  # Alexander Albon
        "monaco": 1.0, "baku": 1.0, "singapore": 1.0, "miami": 1.0,
        "spa": 1.0, "silverstone": 1.0, "monza": 1.0, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.0, "interlagos": 1.0, "zandvoort": 1.0
    },
    "TSU": {  # Yuki Tsunoda
        "monaco": 1.0, "baku": 1.0, "singapore": 1.0, "miami": 1.0,
        "spa": 1.0, "silverstone": 1.0, "monza": 1.0, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.0, "interlagos": 1.0, "zandvoort": 1.0
    },
    "HUL": {  # Nico Hulkenberg
        "monaco": 1.0, "baku": 1.0, "singapore": 1.0, "miami": 1.0,
        "spa": 1.0, "silverstone": 1.0, "monza": 1.0, "red_bull_ring": 1.0,
        "hungaroring": 1.0, "suzuka": 1.0, "interlagos": 1.0, "zandvoort": 1.0
    },
    "LAW": {  # Liam Lawson
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    },
    "HAD": {  # Isack Hadjar
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    },
    "ANT": {  # Kimi Antonelli
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    },
    "BEA": {  # Oliver Bearman
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    },
    "BOR": {  # Gabriel Bortoleto
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    },
    "COL": {  # Franco Colapinto
        "monaco": 0.9, "baku": 0.9, "singapore": 0.9, "miami": 0.9,
        "spa": 0.9, "silverstone": 0.9, "monza": 0.9, "red_bull_ring": 0.9,
        "hungaroring": 0.9, "suzuka": 0.9, "interlagos": 0.9, "zandvoort": 0.9
    }
}

# Qualifying Results (will be updated with live data)
qualifying_results = {
    "VER": None, "NOR": None, "LEC": None, "HAM": None, "RUS": None,
    "PIA": None, "SAI": None, "ALO": None, "STR": None, "GAS": None,
    "OCO": None, "ALB": None, "TSU": None, "HUL": None, "LAW": None,
    "HAD": None, "ANT": None, "BEA": None, "BOR": None, "COL": None
}

# Enhanced Driver Information
drivers = {
    "VER": {
        "id": "VER",
        "name": "Max Verstappen",
        "constructor": "Red Bull Racing",
        "constructor_id": "red_bull",
        "nationality": "Dutch",
        "age": 27,
        "experience_years": 9,
        "world_championships": 3,
        "career_wins": 54,
        "career_podiums": 98,
        "career_poles": 32,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2028,
        "salary_estimate": "40M+",
        "social_media": {
            "instagram": "maxverstappen1",
            "twitter": "Max33Verstappen"
        }
    },
    "NOR": {
        "id": "NOR",
        "name": "Lando Norris",
        "constructor": "McLaren-Mercedes",
        "constructor_id": "mclaren",
        "nationality": "British",
        "age": 24,
        "experience_years": 6,
        "world_championships": 0,
        "career_wins": 1,
        "career_podiums": 15,
        "career_poles": 2,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2026,
        "salary_estimate": "20M+",
        "social_media": {
            "instagram": "landonorris",
            "twitter": "LandoNorris"
        }
    },
    "LEC": {
        "id": "LEC",
        "name": "Charles Leclerc",
        "constructor": "Ferrari",
        "constructor_id": "ferrari",
        "nationality": "Monegasque",
        "age": 26,
        "experience_years": 7,
        "world_championships": 0,
        "career_wins": 5,
        "career_podiums": 30,
        "career_poles": 23,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2029,
        "salary_estimate": "25M+",
        "social_media": {
            "instagram": "charles_leclerc",
            "twitter": "Charles_Leclerc"
        }
    },
    "HAM": {
        "id": "HAM",
        "name": "Lewis Hamilton",
        "constructor": "Ferrari",
        "constructor_id": "ferrari",
        "nationality": "British",
        "age": 39,
        "experience_years": 18,
        "world_championships": 7,
        "career_wins": 103,
        "career_podiums": 197,
        "career_poles": 104,
        "best_finish": 1,
        "team_order": 2,  # New team member
        "contract_until": 2026,
        "salary_estimate": "45M+",
        "social_media": {
            "instagram": "lewishamilton",
            "twitter": "LewisHamilton"
        }
    },
    "RUS": {
        "id": "RUS",
        "name": "George Russell",
        "constructor": "Mercedes",
        "constructor_id": "mercedes",
        "nationality": "British",
        "age": 26,
        "experience_years": 6,
        "world_championships": 0,
        "career_wins": 1,
        "career_podiums": 11,
        "career_poles": 1,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2025,
        "salary_estimate": "15M+",
        "social_media": {
            "instagram": "georgerussell63",
            "twitter": "GeorgeRussell63"
        }
    },
    "PIA": {
        "id": "PIA",
        "name": "Oscar Piastri",
        "constructor": "McLaren-Mercedes",
        "constructor_id": "mclaren",
        "nationality": "Australian",
        "age": 23,
        "experience_years": 2,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 2,
        "career_poles": 0,
        "best_finish": 2,
        "team_order": 2,  # Second driver
        "contract_until": 2026,
        "salary_estimate": "8M+",
        "social_media": {
            "instagram": "oscarpiastri",
            "twitter": "OscarPiastri"
        }
    },
    "SAI": {
        "id": "SAI",
        "name": "Carlos Sainz",
        "constructor": "Ferrari",
        "constructor_id": "ferrari",
        "nationality": "Spanish",
        "age": 29,
        "experience_years": 9,
        "world_championships": 0,
        "career_wins": 2,
        "career_podiums": 18,
        "career_poles": 4,
        "best_finish": 1,
        "team_order": 2,  # Second driver
        "contract_until": 2024,
        "salary_estimate": "12M+",
        "social_media": {
            "instagram": "carlossainz55",
            "twitter": "Carlossainz55"
        }
    },
    "ALO": {
        "id": "ALO",
        "name": "Fernando Alonso",
        "constructor": "Aston Martin",
        "constructor_id": "aston_martin",
        "nationality": "Spanish",
        "age": 42,
        "experience_years": 22,
        "world_championships": 2,
        "career_wins": 32,
        "career_podiums": 106,
        "career_poles": 22,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2026,
        "salary_estimate": "20M+",
        "social_media": {
            "instagram": "fernandoalo_oficial",
            "twitter": "alo_oficial"
        }
    },
    "STR": {
        "id": "STR",
        "name": "Lance Stroll",
        "constructor": "Aston Martin",
        "constructor_id": "aston_martin",
        "nationality": "Canadian",
        "age": 25,
        "experience_years": 7,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 3,
        "career_poles": 1,
        "best_finish": 3,
        "team_order": 2,  # Second driver
        "contract_until": 2025,
        "salary_estimate": "5M+",
        "social_media": {
            "instagram": "lance_stroll",
            "twitter": "Lance_Stroll18"
        }
    },
    "GAS": {
        "id": "GAS",
        "name": "Pierre Gasly",
        "constructor": "Alpine",
        "constructor_id": "alpine",
        "nationality": "French",
        "age": 28,
        "experience_years": 7,
        "world_championships": 0,
        "career_wins": 1,
        "career_podiums": 4,
        "career_poles": 0,
        "best_finish": 1,
        "team_order": 1,  # Team leader
        "contract_until": 2025,
        "salary_estimate": "8M+",
        "social_media": {
            "instagram": "pierregasly",
            "twitter": "PierreGasly"
        }
    },
    "OCO": {
        "id": "OCO",
        "name": "Esteban Ocon",
        "constructor": "Alpine",
        "constructor_id": "alpine",
        "nationality": "French",
        "age": 27,
        "experience_years": 7,
        "world_championships": 0,
        "career_wins": 1,
        "career_podiums": 3,
        "career_poles": 0,
        "best_finish": 1,
        "team_order": 2,  # Second driver
        "contract_until": 2024,
        "salary_estimate": "6M+",
        "social_media": {
            "instagram": "estebanocon",
            "twitter": "OconEsteban"
        }
    },
    "ALB": {
        "id": "ALB",
        "name": "Alexander Albon",
        "constructor": "Williams",
        "constructor_id": "williams",
        "nationality": "Thai-British",
        "age": 27,
        "experience_years": 5,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 2,
        "career_poles": 0,
        "best_finish": 3,
        "team_order": 1,  # Team leader
        "contract_until": 2025,
        "salary_estimate": "4M+",
        "social_media": {
            "instagram": "alex_albon",
            "twitter": "alex_albon"
        }
    },
    "TSU": {
        "id": "TSU",
        "name": "Yuki Tsunoda",
        "constructor": "Racing Bulls",
        "constructor_id": "racing_bulls",
        "nationality": "Japanese",
        "age": 23,
        "experience_years": 4,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 4,
        "team_order": 1,  # Team leader
        "contract_until": 2025,
        "salary_estimate": "3M+",
        "social_media": {
            "instagram": "yukitsunoda",
            "twitter": "YukiTsunoda"
        }
    },
    "HUL": {
        "id": "HUL",
        "name": "Nico Hulkenberg",
        "constructor": "Sauber",
        "constructor_id": "sauber",
        "nationality": "German",
        "age": 36,
        "experience_years": 13,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 1,
        "best_finish": 4,
        "team_order": 1,  # Team leader
        "contract_until": 2025,
        "salary_estimate": "4M+",
        "social_media": {
            "instagram": "nico_hulkenberg",
            "twitter": "HulkHulkenberg"
        }
    },
    "LAW": {
        "id": "LAW",
        "name": "Liam Lawson",
        "constructor": "Racing Bulls",
        "constructor_id": "racing_bulls",
        "nationality": "New Zealander",
        "age": 22,
        "experience_years": 1,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 9,
        "team_order": 2,  # Second driver
        "contract_until": 2025,
        "salary_estimate": "2M+",
        "social_media": {
            "instagram": "liamlawson",
            "twitter": "LiamLawson30"
        }
    },
    "HAD": {
        "id": "HAD",
        "name": "Isack Hadjar",
        "constructor": "Racing Bulls",
        "constructor_id": "racing_bulls",
        "nationality": "French",
        "age": 20,
        "experience_years": 1,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 12,
        "team_order": 3,  # Third driver
        "contract_until": 2025,
        "salary_estimate": "1M+",
        "social_media": {
            "instagram": "isackhadjar",
            "twitter": "IsackHadjar"
        }
    },
    "ANT": {
        "id": "ANT",
        "name": "Andrea Kimi Antonelli",
        "constructor": "Mercedes",
        "constructor_id": "mercedes",
        "nationality": "Italian",
        "age": 18,
        "experience_years": 0,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 0,
        "team_order": 2,  # Second driver
        "contract_until": 2026,
        "salary_estimate": "1M+",
        "social_media": {
            "instagram": "kimi_antonelli",
            "twitter": "KimiAntonelli"
        }
    },
    "BEA": {
        "id": "BEA",
        "name": "Oliver Bearman",
        "constructor": "Haas",
        "constructor_id": "haas",
        "nationality": "British",
        "age": 19,
        "experience_years": 0,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 0,
        "team_order": 2,  # Second driver
        "contract_until": 2025,
        "salary_estimate": "1M+",
        "social_media": {
            "instagram": "oliver_bearman",
            "twitter": "OliverBearman"
        }
    },
    "BOR": {
        "id": "BOR",
        "name": "Gabriel Bortoleto",
        "constructor": "Sauber",
        "constructor_id": "sauber",
        "nationality": "Brazilian",
        "age": 20,
        "experience_years": 0,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 0,
        "team_order": 2,  # Second driver
        "contract_until": 2025,
        "salary_estimate": "1M+",
        "social_media": {
            "instagram": "gabrielbortoleto",
            "twitter": "GabrielBortoleto"
        }
    },
    "COL": {
        "id": "COL",
        "name": "Franco Colapinto",
        "constructor": "Alpine",
        "constructor_id": "alpine",
        "nationality": "Argentine",
        "age": 20,
        "experience_years": 0,
        "world_championships": 0,
        "career_wins": 0,
        "career_podiums": 0,
        "career_poles": 0,
        "best_finish": 0,
        "team_order": 2,  # Second driver
        "contract_until": 2025,
        "salary_estimate": "1M+",
        "social_media": {
            "instagram": "francocolapinto",
            "twitter": "FrancoColapinto"
        }
    }
}

# Constructor Information
constructors = {
    "red_bull": {
        "name": "Red Bull Racing",
        "full_name": "Oracle Red Bull Racing",
        "base": "Milton Keynes, UK",
        "team_principal": "Christian Horner",
        "chassis": "RB21",
        "power_unit": "Honda RBPT",
        "first_entry": 1997,
        "world_championships": 6,
        "highest_race_finish": 1,
        "pole_positions": 95,
        "fastest_laps": 89,
        "budget_cap_status": "compliant",
        "technical_director": "Pierre Waché",
        "chief_engineer": "Gianpiero Lambiase"
    },
    "mclaren": {
        "name": "McLaren-Mercedes",
        "full_name": "McLaren F1 Team",
        "base": "Woking, UK",
        "team_principal": "Andrea Stella",
        "chassis": "MCL38",
        "power_unit": "Mercedes",
        "first_entry": 1966,
        "world_championships": 8,
        "highest_race_finish": 1,
        "pole_positions": 156,
        "fastest_laps": 161,
        "budget_cap_status": "compliant",
        "technical_director": "Peter Prodromou",
        "chief_engineer": "Will Joseph"
    },
    "ferrari": {
        "name": "Ferrari",
        "full_name": "Scuderia Ferrari",
        "base": "Maranello, Italy",
        "team_principal": "Frédéric Vasseur",
        "chassis": "SF-24",
        "power_unit": "Ferrari",
        "first_entry": 1950,
        "world_championships": 16,
        "highest_race_finish": 1,
        "pole_positions": 249,
        "fastest_laps": 259,
        "budget_cap_status": "compliant",
        "technical_director": "Enrico Cardile",
        "chief_engineer": "Diego Ioverno"
    },
    "mercedes": {
        "name": "Mercedes",
        "full_name": "Mercedes-AMG Petronas F1 Team",
        "base": "Brackley, UK",
        "team_principal": "Toto Wolff",
        "chassis": "W15",
        "power_unit": "Mercedes",
        "first_entry": 1954,
        "world_championships": 8,
        "highest_race_finish": 1,
        "pole_positions": 136,
        "fastest_laps": 133,
        "budget_cap_status": "compliant",
        "technical_director": "James Allison",
        "chief_engineer": "Andrew Shovlin"
    }
}

# Weather Sensitivity Factors (how drivers perform in different conditions)
weather_sensitivity = {
    "VER": {"wet": 1.2, "dry": 1.0, "mixed": 1.1},      # Excellent in wet
    "NOR": {"wet": 1.1, "dry": 1.0, "mixed": 1.05},     # Good in wet
    "LEC": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "HAM": {"wet": 1.15, "dry": 1.0, "mixed": 1.1},     # Strong in wet
    "RUS": {"wet": 1.05, "dry": 1.0, "mixed": 1.0},     # Slight wet advantage
    "PIA": {"wet": 0.95, "dry": 1.0, "mixed": 0.98},    # Learning wet conditions
    "SAI": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "ALO": {"wet": 1.1, "dry": 1.0, "mixed": 1.05},     # Experienced in wet
    "STR": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Struggles in wet
    "GAS": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "OCO": {"wet": 0.95, "dry": 1.0, "mixed": 0.98},    # Slight wet struggle
    "ALB": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "TSU": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "HUL": {"wet": 1.0, "dry": 1.0, "mixed": 1.0},      # Consistent
    "LAW": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Rookie wet struggle
    "HAD": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Rookie wet struggle
    "ANT": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Rookie wet struggle
    "BEA": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Rookie wet struggle
    "BOR": {"wet": 0.9, "dry": 1.0, "mixed": 0.95},     # Rookie wet struggle
    "COL": {"wet": 0.9, "dry": 1.0, "mixed": 0.95}      # Rookie wet struggle
}

def get_driver_info(driver_id: str) -> Dict[str, Any]:
    """Get complete driver information"""
    if driver_id not in drivers:
        return {}
    
    driver = drivers[driver_id].copy()
    driver.update({
        "season_points": driver_standings.get(driver_id, 0.0),
        "recent_form": recent_form.get(driver_id, 1.0),
        "qualifying_position": qualifying_results.get(driver_id),
        "weather_sensitivity": weather_sensitivity.get(driver_id, {"wet": 1.0, "dry": 1.0, "mixed": 1.0}),
        "constructor_info": constructors.get(driver["constructor_id"], {})
    })
    
    return driver

def get_all_drivers() -> List[Dict[str, Any]]:
    """Get information for all drivers"""
    return [get_driver_info(driver_id) for driver_id in drivers.keys()]

def update_qualifying_results(race_round: int, results: Dict[str, int]):
    """Update qualifying results for a specific race"""
    global qualifying_results
    for driver_id, position in results.items():
        if driver_id in qualifying_results:
            qualifying_results[driver_id] = position

def update_driver_standings(new_standings: Dict[str, float]):
    """Update driver standings"""
    global driver_standings
    driver_standings.update(new_standings)

def get_constructor_drivers(constructor_id: str) -> List[Dict[str, Any]]:
    """Get all drivers for a specific constructor"""
    return [
        get_driver_info(driver_id) 
        for driver_id, driver in drivers.items() 
        if driver["constructor_id"] == constructor_id
    ]

def get_driver_rankings() -> List[Dict[str, Any]]:
    """Get drivers sorted by season points"""
    driver_list = get_all_drivers()
    return sorted(driver_list, key=lambda x: x["season_points"], reverse=True)
