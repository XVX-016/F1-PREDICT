import { db } from '../config/firebase.js';

// 2025 F1 Season Data
const f1Season2025 = [
  {
    round: 1,
    name: 'Bahrain Grand Prix',
    circuit: 'Bahrain International Circuit',
    country: 'Bahrain',
    date_time: '2025-03-02T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 2,
    name: 'Saudi Arabian Grand Prix',
    circuit: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    date_time: '2025-03-09T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 3,
    name: 'Australian Grand Prix',
    circuit: 'Albert Park Circuit',
    country: 'Australia',
    date_time: '2025-03-23T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 4,
    name: 'Japanese Grand Prix',
    circuit: 'Suzuka International Racing Course',
    country: 'Japan',
    date_time: '2025-04-06T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 5,
    name: 'Chinese Grand Prix',
    circuit: 'Shanghai International Circuit',
    country: 'China',
    date_time: '2025-04-20T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 6,
    name: 'Miami Grand Prix',
    circuit: 'Miami International Autodrome',
    country: 'United States',
    date_time: '2025-05-04T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 7,
    name: 'Emilia Romagna Grand Prix',
    circuit: 'Imola Circuit',
    country: 'Italy',
    date_time: '2025-05-18T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 8,
    name: 'Monaco Grand Prix',
    circuit: 'Circuit de Monaco',
    country: 'Monaco',
    date_time: '2025-05-25T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 9,
    name: 'Spanish Grand Prix',
    circuit: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    date_time: '2025-06-01T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 10,
    name: 'Canadian Grand Prix',
    circuit: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    date_time: '2025-06-15T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 11,
    name: 'Austrian Grand Prix',
    circuit: 'Red Bull Ring',
    country: 'Austria',
    date_time: '2025-06-29T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 12,
    name: 'British Grand Prix',
    circuit: 'Silverstone Circuit',
    country: 'Great Britain',
    date_time: '2025-07-06T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 13,
    name: 'Hungarian Grand Prix',
    circuit: 'Hungaroring',
    country: 'Hungary',
    date_time: '2025-07-20T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 14,
    name: 'Belgian Grand Prix',
    circuit: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    date_time: '2025-07-27T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 15,
    name: 'Dutch Grand Prix',
    circuit: 'Circuit Zandvoort',
    country: 'Netherlands',
    date_time: '2025-08-24T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 16,
    name: 'Italian Grand Prix',
    circuit: 'Monza Circuit',
    country: 'Italy',
    date_time: '2025-09-07T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 17,
    name: 'Azerbaijan Grand Prix',
    circuit: 'Baku City Circuit',
    country: 'Azerbaijan',
    date_time: '2025-09-21T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 18,
    name: 'Singapore Grand Prix',
    circuit: 'Marina Bay Street Circuit',
    country: 'Singapore',
    date_time: '2025-10-05T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 19,
    name: 'United States Grand Prix',
    circuit: 'Circuit of the Americas',
    country: 'United States',
    date_time: '2025-10-19T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 20,
    name: 'Mexican Grand Prix',
    circuit: 'Autódromo Hermanos Rodríguez',
    country: 'Mexico',
    date_time: '2025-10-26T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 21,
    name: 'São Paulo Grand Prix',
    circuit: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    date_time: '2025-11-02T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 22,
    name: 'Las Vegas Grand Prix',
    circuit: 'Las Vegas Strip Circuit',
    country: 'United States',
    date_time: '2025-11-16T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 23,
    name: 'Qatar Grand Prix',
    circuit: 'Lusail International Circuit',
    country: 'Qatar',
    date_time: '2025-11-23T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  },
  {
    round: 24,
    name: 'Abu Dhabi Grand Prix',
    circuit: 'Yas Marina Circuit',
    country: 'United Arab Emirates',
    date_time: '2025-11-30T14:00:00Z',
    season: 2025,
    status: 'upcoming'
  }
];

// 2025 F1 Drivers
const f1Drivers2025 = [
  {
    driver_id: 'max_verstappen',
    name: 'Max Verstappen',
    nationality: 'Dutch',
    team: 'Red Bull Racing',
    car_number: 1,
    season: 2025
  },
  {
    driver_id: 'sergio_perez',
    name: 'Sergio Pérez',
    nationality: 'Mexican',
    team: 'Red Bull Racing',
    car_number: 11,
    season: 2025
  },
  {
    driver_id: 'lewis_hamilton',
    name: 'Lewis Hamilton',
    nationality: 'British',
    team: 'Mercedes',
    car_number: 44,
    season: 2025
  },
  {
    driver_id: 'george_russell',
    name: 'George Russell',
    nationality: 'British',
    team: 'Mercedes',
    car_number: 63,
    season: 2025
  },
  {
    driver_id: 'charles_leclerc',
    name: 'Charles Leclerc',
    nationality: 'Monegasque',
    team: 'Ferrari',
    car_number: 16,
    season: 2025
  },
  {
    driver_id: 'carlos_sainz',
    name: 'Carlos Sainz',
    nationality: 'Spanish',
    team: 'Ferrari',
    car_number: 55,
    season: 2025
  },
  {
    driver_id: 'lando_norris',
    name: 'Lando Norris',
    nationality: 'British',
    team: 'McLaren',
    car_number: 4,
    season: 2025
  },
  {
    driver_id: 'oscar_piastri',
    name: 'Oscar Piastri',
    nationality: 'Australian',
    team: 'McLaren',
    car_number: 81,
    season: 2025
  },
  {
    driver_id: 'fernando_alonso',
    name: 'Fernando Alonso',
    nationality: 'Spanish',
    team: 'Aston Martin',
    car_number: 14,
    season: 2025
  },
  {
    driver_id: 'lance_stroll',
    name: 'Lance Stroll',
    nationality: 'Canadian',
    team: 'Aston Martin',
    car_number: 18,
    season: 2025
  },
  {
    driver_id: 'esteban_ocon',
    name: 'Esteban Ocon',
    nationality: 'French',
    team: 'Alpine',
    car_number: 31,
    season: 2025
  },
  {
    driver_id: 'pierre_gasly',
    name: 'Pierre Gasly',
    nationality: 'French',
    team: 'Alpine',
    car_number: 10,
    season: 2025
  },
  {
    driver_id: 'valtteri_bottas',
    name: 'Valtteri Bottas',
    nationality: 'Finnish',
    team: 'Kick Sauber',
    car_number: 77,
    season: 2025
  },
  {
    driver_id: 'zhou_guanyu',
    name: 'Zhou Guanyu',
    nationality: 'Chinese',
    team: 'Kick Sauber',
    car_number: 24,
    season: 2025
  },
  {
    driver_id: 'alex_albon',
    name: 'Alexander Albon',
    nationality: 'Thai',
    team: 'Williams',
    car_number: 23,
    season: 2025
  },
  {
    driver_id: 'logan_sargeant',
    name: 'Logan Sargeant',
    nationality: 'American',
    team: 'Williams',
    car_number: 2,
    season: 2025
  },
  {
    driver_id: 'yuki_tsunoda',
    name: 'Yuki Tsunoda',
    nationality: 'Japanese',
    team: 'RB',
    car_number: 22,
    season: 2025
  },
  {
    driver_id: 'daniel_ricciardo',
    name: 'Daniel Ricciardo',
    nationality: 'Australian',
    team: 'RB',
    car_number: 3,
    season: 2025
  },
  {
    driver_id: 'nico_hulkenberg',
    name: 'Nico Hülkenberg',
    nationality: 'German',
    team: 'Haas F1 Team',
    car_number: 27,
    season: 2025
  },
  {
    driver_id: 'kevin_magnussen',
    name: 'Kevin Magnussen',
    nationality: 'Danish',
    team: 'Haas F1 Team',
    car_number: 20,
    season: 2025
  }
];

async function seedF1Data() {
  try {
    console.log('🌱 Starting F1 data seeding...');
    
    // Seed races
    console.log('🏁 Seeding races...');
    for (const race of f1Season2025) {
      const raceRef = db.collection('races').doc();
      await raceRef.set({
        ...race,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`✅ Added race: ${race.name}`);
    }
    
    // Seed drivers
    console.log('👨‍🏁 Seeding drivers...');
    for (const driver of f1Drivers2025) {
      const driverRef = db.collection('drivers').doc();
      await driverRef.set({
        ...driver,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`✅ Added driver: ${driver.name} (${driver.team})`);
    }
    
    console.log('🎉 F1 data seeding completed successfully!');
    console.log(`📊 Added ${f1Season2025.length} races and ${f1Drivers2025.length} drivers`);
    
  } catch (error) {
    console.error('❌ Error seeding F1 data:', error);
  }
}

// Run the seeding function
seedF1Data();
