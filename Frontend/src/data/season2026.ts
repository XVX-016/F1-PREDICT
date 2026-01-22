
export interface Driver {
    id: string;
    name: string;
    number: number;
    image: string;
    countryCode: string; // Added for flag display if needed
}

export interface Team {
    id: string;
    name: string;
    powerUnit: string;
    drivers: Driver[];
    color: string;
    carImage: string;
}

export const SEASON_2026_TEAMS: Team[] = [
    {
        id: 'mclaren',
        name: 'McLaren',
        powerUnit: 'Mercedes',
        color: '#FF8700',
        carImage: '/models/mclaren.png',
        drivers: [
            { id: 'nor', name: 'Lando Norris', number: 1, image: '/avatars/landonorris.png', countryCode: 'GBR' },
            { id: 'pia', name: 'Oscar Piastri', number: 81, image: '/avatars/oscarpiastri.png', countryCode: 'AUS' },
        ]
    },
    {
        id: 'ferrari',
        name: 'Ferrari',
        powerUnit: 'Ferrari',
        color: '#F91536',
        carImage: '/models/ferrari.png',
        drivers: [
            { id: 'lec', name: 'Charles Leclerc', number: 16, image: '/avatars/charlesleclerc.png', countryCode: 'MON' },
            { id: 'ham', name: 'Lewis Hamilton', number: 44, image: '/avatars/lewishamilton.png', countryCode: 'GBR' },
        ]
    },
    {
        id: 'redbull',
        name: 'Red Bull Racing',
        powerUnit: 'RB Ford',
        color: '#3671C6',
        carImage: '/models/redbull.png',
        drivers: [
            { id: 'ver', name: 'Max Verstappen', number: 3, image: '/avatars/maxverstappen.png', countryCode: 'NED' },
            { id: 'had', name: 'Isack Hadjar', number: 6, image: '/avatars/2026redbullracingisahad01right.avif', countryCode: 'FRA' },
        ]
    },
    {
        id: 'mercedes',
        name: 'Mercedes',
        powerUnit: 'Mercedes',
        color: '#6CD3BF',
        carImage: '/models/mercedes.png',
        drivers: [
            { id: 'rus', name: 'George Russell', number: 63, image: '/avatars/georgerussell.png', countryCode: 'GBR' },
            { id: 'ant', name: 'Kimi Antonelli', number: 12, image: '/avatars/andreakimiantonelli.png', countryCode: 'ITA' },
        ]
    },
    {
        id: 'astonmartin',
        name: 'Aston Martin',
        powerUnit: 'Honda',
        color: '#358C75',
        carImage: '/models/astonmartin.png',
        drivers: [
            { id: 'alo', name: 'Fernando Alonso', number: 14, image: '/avatars/fernandoalonso.png', countryCode: 'ESP' },
            { id: 'str', name: 'Lance Stroll', number: 18, image: '/avatars/lancestroll.png', countryCode: 'CAN' },
        ]
    },
    {
        id: 'audi',
        name: 'Audi',
        powerUnit: 'Audi',
        color: '#CC0000', // Audi Red
        carImage: '/models/2026audicarright.avif',
        drivers: [
            { id: 'hul', name: 'Nico Hülkenberg', number: 27, image: '/avatars/2026audinichul01right.avif', countryCode: 'GER' },
            { id: 'bor', name: 'Gabriel Bortoleto', number: 5, image: '/avatars/2026audigabbor01right.avif', countryCode: 'BRA' },
        ]
    },
    {
        id: 'cadillac',
        name: 'Cadillac',
        powerUnit: 'Ferrari',
        color: '#FFD700', // Gold/Yellow ish
        carImage: '/models/2026cadillaccarright.avif',
        drivers: [
            { id: 'per', name: 'Sergio Pérez', number: 11, image: '/avatars/2026cadillacserper01right.avif', countryCode: 'MEX' },
            { id: 'bot', name: 'Valtteri Bottas', number: 77, image: '/avatars/2026cadillacvalbot01right.avif', countryCode: 'FIN' },
        ]
    },
    {
        id: 'williams',
        name: 'Williams',
        powerUnit: 'Mercedes',
        color: '#37BEDD',
        carImage: '/models/williams.png',
        drivers: [
            { id: 'alb', name: 'Alex Albon', number: 23, image: '/avatars/alexanderalbon.png', countryCode: 'THA' },
            { id: 'sai', name: 'Carlos Sainz', number: 55, image: '/avatars/carlossainz.png', countryCode: 'ESP' },
        ]
    },
    {
        id: 'alpine',
        name: 'Alpine',
        powerUnit: 'Mercedes',
        color: '#2293D1',
        carImage: '/models/alpine.png',
        drivers: [
            { id: 'gas', name: 'Pierre Gasly', number: 10, image: '/avatars/pierregasly.png', countryCode: 'FRA' },
            { id: 'col', name: 'Franco Colapinto', number: 43, image: '/avatars/francocolapinto.png', countryCode: 'ARG' },
        ]
    },
    {
        id: 'haas',
        name: 'Haas',
        powerUnit: 'Ferrari',
        color: '#B6BABD',
        carImage: '/models/haas.png',
        drivers: [
            { id: 'oco', name: 'Esteban Ocon', number: 31, image: '/avatars/estebanocon.png', countryCode: 'FRA' },
            { id: 'bea', name: 'Oliver Bearman', number: 87, image: '/avatars/oliverbearman.png', countryCode: 'GBR' },
        ]
    },
    {
        id: 'rb',
        name: 'Racing Bulls',
        powerUnit: 'RB Ford',
        color: '#5E8FAA',
        carImage: '/models/racingbulls.png',
        drivers: [
            { id: 'law', name: 'Liam Lawson', number: 30, image: '/avatars/liamlawson.png', countryCode: 'NZL' },
            { id: 'lin', name: 'Arvid Lindblad', number: 41, image: '/avatars/2026racingbullsarvlin01right.avif', countryCode: 'GBR' },
        ]
    }
];

// Flat list of drivers for Drivers Page
export const SEASON_2026_DRIVERS = SEASON_2026_TEAMS.flatMap(team =>
    team.drivers.map(driver => ({
        ...driver,
        teamName: team.name,
        teamColor: team.color,
        teamId: team.id
    }))
);
