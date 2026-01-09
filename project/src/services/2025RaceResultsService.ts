// Service to fetch 2025 F1 race results from the backend data

export interface RaceResult2025 {
  round: number;
  season: string;
  raceName: string;
  date: string;
  poleDriverId: string;
  podiumDriverIds: string[];
  circuitName: string;
  country: string;
}

export interface DriverResult {
  driver: string;
  team: string;
}

export default class RaceResults2025Service {
  private static instance: RaceResults2025Service;
  
  private constructor() {}
  
  public static getInstance(): RaceResults2025Service {
    if (!RaceResults2025Service.instance) {
      RaceResults2025Service.instance = new RaceResults2025Service();
    }
    return RaceResults2025Service.instance;
  }

  // Map driver codes to full names
  private getDriverName(driverCode: string): string {
    const driverMap: Record<string, string> = {
      'VER': 'Max Verstappen',
      'LEC': 'Charles Leclerc',
      'HAM': 'Lewis Hamilton',
      'NOR': 'Lando Norris',
      'PIA': 'Oscar Piastri',
      'RUS': 'George Russell',
      'SAI': 'Carlos Sainz',
      'ALO': 'Fernando Alonso',
      'GAS': 'Pierre Gasly',
      'OCO': 'Esteban Ocon',
      'TSU': 'Yuki Tsunoda',
      'STR': 'Lance Stroll',
      'ALB': 'Alexander Albon',
      'HUL': 'Nico Hulkenberg',
      'ANT': 'Andrea Kimi Antonelli',
      'BEA': 'Oliver Bearman',
      'BOR': 'Gabriel Bortoleto',
      'DOO': 'Jack Doohan',
      'HAD': 'Isack Hadjar',
      'LAW': 'Liam Lawson'
    };
    return driverMap[driverCode] || driverCode;
  }

  // Map driver codes to normalized IDs
  private getDriverId(driverCode: string): string {
    const driverMap: Record<string, string> = {
      'VER': 'maxverstappen',
      'LEC': 'charlesleclerc',
      'HAM': 'lewishamilton',
      'NOR': 'landonorris',
      'PIA': 'oscarpiastri',
      'RUS': 'georgerussell',
      'SAI': 'carlossainz',
      'ALO': 'fernandoalonso',
      'GAS': 'pierregasly',
      'OCO': 'estebanocon',
      'TSU': 'yukitsunoda',
      'STR': 'lancestroll',
      'ALB': 'alexanderalbon',
      'HUL': 'nicohulkenberg',
      'ANT': 'andreakimiantonelli',
      'BEA': 'oliverbearman',
      'BOR': 'gabrielbortoleto',
      'DOO': 'jackdoohan',
      'HAD': 'isackhadjar',
      'LAW': 'liamlawson'
    };
    return driverMap[driverCode] || driverCode.toLowerCase();
  }

  // Get circuit information
  private getCircuitInfo(raceName: string): { circuitName: string; country: string; date: string } {
    const circuitMap: Record<string, { circuitName: string; country: string; date: string }> = {
      'Bahrain Grand Prix': {
        circuitName: 'Bahrain International Circuit',
        country: 'Bahrain',
        date: '2025-03-02'
      },
      'Saudi Arabian Grand Prix': {
        circuitName: 'Jeddah Corniche Circuit',
        country: 'Saudi Arabia',
        date: '2025-03-09'
      },
      'Australian Grand Prix': {
        circuitName: 'Albert Park Circuit',
        country: 'Australia',
        date: '2025-03-16'
      },
      'Chinese Grand Prix': {
        circuitName: 'Shanghai International Circuit',
        country: 'China',
        date: '2025-03-23'
      },
      'Japanese Grand Prix': {
        circuitName: 'Suzuka International Racing Course',
        country: 'Japan',
        date: '2025-04-06'
      },
      'Miami Grand Prix': {
        circuitName: 'Miami International Autodrome',
        country: 'USA',
        date: '2025-05-04'
      },
      'Emilia Romagna Grand Prix': {
        circuitName: 'Autodromo Enzo e Dino Ferrari',
        country: 'Italy',
        date: '2025-05-18'
      },
      'Monaco Grand Prix': {
        circuitName: 'Circuit de Monaco',
        country: 'Monaco',
        date: '2025-05-25'
      },
      'Spanish Grand Prix': {
        circuitName: 'Circuit de Barcelona-Catalunya',
        country: 'Spain',
        date: '2025-06-01'
      },
      'Canadian Grand Prix': {
        circuitName: 'Circuit Gilles Villeneuve',
        country: 'Canada',
        date: '2025-06-15'
      },
      'Austrian Grand Prix': {
        circuitName: 'Red Bull Ring',
        country: 'Austria',
        date: '2025-06-29'
      },
      'British Grand Prix': {
        circuitName: 'Silverstone Circuit',
        country: 'United Kingdom',
        date: '2025-07-13'
      },
      'Hungarian Grand Prix': {
        circuitName: 'Hungaroring',
        country: 'Hungary',
        date: '2025-07-27'
      },
      'Belgian Grand Prix': {
        circuitName: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        date: '2025-08-03'
      },
      'Dutch Grand Prix': {
        circuitName: 'Circuit Zandvoort',
        country: 'Netherlands',
        date: '2025-08-24'
      },
      'Emilia Romagna Grand Prix': {
        circuitName: 'Autodromo Enzo e Dino Ferrari',
        country: 'Italy',
        date: '2025-05-18'
      },
      'Monaco Grand Prix': {
        circuitName: 'Circuit de Monaco',
        country: 'Monaco',
        date: '2025-05-25'
      },
      'Spanish Grand Prix': {
        circuitName: 'Circuit de Barcelona-Catalunya',
        country: 'Spain',
        date: '2025-06-01'
      },
      'Canadian Grand Prix': {
        circuitName: 'Circuit Gilles Villeneuve',
        country: 'Canada',
        date: '2025-06-15'
      },
      'Austrian Grand Prix': {
        circuitName: 'Red Bull Ring',
        country: 'Austria',
        date: '2025-06-29'
      },
      'British Grand Prix': {
        circuitName: 'Silverstone Circuit',
        country: 'United Kingdom',
        date: '2025-07-13'
      },
      'Hungarian Grand Prix': {
        circuitName: 'Hungaroring',
        country: 'Hungary',
        date: '2025-07-27'
      },
      'Belgian Grand Prix': {
        circuitName: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        date: '2025-08-03'
      }
    };
    
    return circuitMap[raceName] || {
      circuitName: 'Circuit Information',
      country: 'Unknown',
      date: '2025-01-01'
    };
  }

  // Fetch race results from backend
  private async fetchRaceResults(raceName: string): Promise<{ race: DriverResult[]; qualifying: DriverResult[] } | null> {
    try {
      // Convert race name to directory format
      const raceDir = raceName.replace(/\s+/g, ' ');
      
      console.log(`🔍 Attempting to fetch race results for: ${raceName}`);
      console.log(`🔍 Race directory: ${raceDir}`);
      
      // Try different path approaches
      const possiblePaths = [
        `../../backend/2025-race-data/${raceDir}/Race/drivers.json`,
        `/backend/2025-race-data/${raceDir}/Race/drivers.json`,
        `./backend/2025-race-data/${raceDir}/Race/drivers.json`,
        `../backend/2025-race-data/${raceDir}/Race/drivers.json`,
        // Fallback to public directory
        `/race-data/${raceDir.toLowerCase().replace(/\s+/g, '-')}-race.json`
      ];
      
      let raceData = null;
      let qualifyingData = null;
      
      // Try to fetch race results
      for (const path of possiblePaths) {
        try {
          console.log(`🔍 Trying race path: ${path}`);
          const raceResponse = await fetch(path);
          if (raceResponse.ok) {
            raceData = await raceResponse.json();
            console.log(`✅ Successfully fetched race data from: ${path}`);
            break;
          } else {
            console.log(`❌ Failed to fetch race data from: ${path} (${raceResponse.status})`);
          }
        } catch (error) {
          console.log(`❌ Error fetching race data from: ${path}`, error);
        }
      }
      
      if (!raceData) {
        console.log(`❌ Could not fetch race data for ${raceName} from any path`);
        return null;
      }
      
      // Try to fetch qualifying results
      for (const path of possiblePaths) {
        try {
          let qualifyingPath;
          if (path.includes('/race-data/')) {
            // For public directory files, replace -race with -qualifying
            qualifyingPath = path.replace('-race.json', '-qualifying.json');
          } else {
            qualifyingPath = path.replace('/Race/', '/Qualifying/');
          }
          console.log(`🔍 Trying qualifying path: ${qualifyingPath}`);
          const qualifyingResponse = await fetch(qualifyingPath);
          if (qualifyingResponse.ok) {
            qualifyingData = await qualifyingResponse.json();
            console.log(`✅ Successfully fetched qualifying data from: ${qualifyingPath}`);
            break;
          } else {
            console.log(`❌ Failed to fetch qualifying data from: ${qualifyingPath} (${qualifyingResponse.status})`);
          }
        } catch (error) {
          console.log(`❌ Error fetching qualifying data from: ${qualifyingPath}`, error);
        }
      }
      
      if (!qualifyingData) {
        console.log(`❌ Could not fetch qualifying data for ${raceName} from any path`);
        return null;
      }
      
      return {
        race: raceData.drivers || [],
        qualifying: qualifyingData.drivers || []
      };
    } catch (error) {
      console.warn(`Failed to fetch results for ${raceName}:`, error);
      return null;
    }
  }

  // Get all available 2025 race results
  public async get2025RaceResults(): Promise<RaceResult2025[]> {
    const races = [
      'Bahrain Grand Prix',
      'Saudi Arabian Grand Prix',
      'Australian Grand Prix',
      'Chinese Grand Prix',
      'Japanese Grand Prix',
      'Miami Grand Prix',
      'Emilia Romagna Grand Prix',
      'Monaco Grand Prix',
      'Spanish Grand Prix',
      'Canadian Grand Prix',
      'Austrian Grand Prix',
      'British Grand Prix',
      'Hungarian Grand Prix',
      'Belgian Grand Prix',
      'Dutch Grand Prix'
    ];

    const results: RaceResult2025[] = [];
    let round = 1;

    for (const raceName of races) {
      try {
        const raceData = await this.fetchRaceResults(raceName);
        
        if (raceData && raceData.race.length > 0) {
          const circuitInfo = this.getCircuitInfo(raceName);
          
          // Get podium finishers (top 3)
          const podiumDriverIds = raceData.race.slice(0, 3).map((driver: DriverResult) => 
            this.getDriverId(driver.driver)
          );
          
          // Get pole position (first in qualifying)
          const poleDriverId = raceData.qualifying.length > 0 ? 
            this.getDriverId(raceData.qualifying[0].driver) : '';

          results.push({
            round,
            season: '2025',
            raceName,
            date: circuitInfo.date,
            poleDriverId,
            podiumDriverIds,
            circuitName: circuitInfo.circuitName,
            country: circuitInfo.country
          });
          
          round++;
        }
      } catch (error) {
        console.warn(`Failed to process ${raceName}:`, error);
      }
    }

    // Sort by date (most recent first)
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get driver name from code
  public getDriverNameFromCode(driverCode: string): string {
    return this.getDriverName(driverCode);
  }

  // Get driver ID from code
  public getDriverIdFromCode(driverCode: string): string {
    return this.getDriverId(driverCode);
  }
}
