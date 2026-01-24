
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
// Default simplified schedule for 2026
// Dates based on provisional calendar found in search
// Default simplified schedule for 2026
// Dates based on provisional calendar found in search
export const SEASON_2026_SCHEDULE = [
    { round: 1, raceName: "Australian Grand Prix", circuit: "Albert Park Circuit", country: "Australia", city: "Melbourne", date: "2026-03-08", time: "05:00:00Z", trackImg: "/circuits/f1_2024_aus_outline.png", bannerImg: "/track_schedule/Australia.webp", circuitMap: "/f1_tracks/Australia_Albert_Park.png" },
    { round: 2, raceName: "Chinese Grand Prix", circuit: "Shanghai International Circuit", country: "China", city: "Shanghai", date: "2026-03-15", time: "07:00:00Z", isSprint: true, trackImg: "/circuits/f1_2024_chn_outline.png", bannerImg: "/track_schedule/China.webp", circuitMap: "/f1_tracks/China_Shanghai_International.png" },
    { round: 3, raceName: "Japanese Grand Prix", circuit: "Suzuka Circuit", country: "Japan", city: "Suzuka", date: "2026-03-29", time: "05:00:00Z", trackImg: "/circuits/f1_2024_jap_outline.png", bannerImg: "/track_schedule/Japan.webp", circuitMap: "/f1_tracks/Japan_Suzuka.png" },
    { round: 4, raceName: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", country: "Bahrain", city: "Sakhir", date: "2026-04-12", time: "15:00:00Z", trackImg: "/circuits/f1_2024_bhr_outline.png", bannerImg: "/track_schedule/Bahrain.avif", circuitMap: "/f1_tracks/Bahrain_Bahrain_International.png" },
    { round: 5, raceName: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", country: "Saudi Arabia", city: "Jeddah", date: "2026-04-19", time: "17:00:00Z", trackImg: "/circuits/f1_2024_sau_outline.png", bannerImg: "/track_schedule/Saudi_Arabia.avif", circuitMap: "/f1_tracks/Saudi_Arabia_Jeddah_Corniche.png" },
    { round: 6, raceName: "Miami Grand Prix", circuit: "Miami International Autodrome", country: "USA", city: "Miami", date: "2026-05-03", time: "19:30:00Z", isSprint: true, trackImg: "/circuits/f1_2024_mia_outline.png", bannerImg: "/track_schedule/Miami.avif", circuitMap: "/f1_tracks/USA_Miami_International.png" },
    { round: 7, raceName: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", country: "Canada", city: "Montreal", date: "2026-05-24", time: "18:00:00Z", isSprint: true, trackImg: "/circuits/f1_2024_can_outline.png", bannerImg: "/track_schedule/Canada.avif", circuitMap: "/f1_tracks/Canada_Gilles_Villeneuve.png" },
    { round: 8, raceName: "Monaco Grand Prix", circuit: "Circuit de Monaco", country: "Monaco", city: "Monte Carlo", date: "2026-06-07", time: "13:00:00Z", trackImg: "/circuits/f1_2024_mco_outline.png", bannerImg: "/track_schedule/Monaco.avif", circuitMap: "/f1_tracks/Monaco_Circuit_de_Monaco.png" },
    { round: 9, raceName: "Barcelona-Catalunya Grand Prix", circuit: "Circuit de Barcelona-Catalunya", country: "Spain", city: "Barcelona", date: "2026-06-14", time: "13:00:00Z", trackImg: "/circuits/f1_2024_spn_outline.png", bannerImg: "/track_schedule/Spain.avif", circuitMap: "/f1_tracks/Spain_Barcelona_Catalunya.png" },
    { round: 10, raceName: "Austrian Grand Prix", circuit: "Red Bull Ring", country: "Austria", city: "Spielberg", date: "2026-06-28", time: "13:00:00Z", trackImg: "/circuits/f1_2024_aut_outline.png", bannerImg: "/track_schedule/Austria.avif", circuitMap: "/f1_tracks/Austria_Red_Bull_Ring.png" },
    { round: 11, raceName: "British Grand Prix", circuit: "Silverstone Circuit", country: "United Kingdom", city: "Silverstone", date: "2026-07-05", time: "14:00:00Z", isSprint: true, trackImg: "/circuits/silverstone.png", bannerImg: "/track_schedule/Great Britain.avif", circuitMap: "/f1_tracks/Great_Britain_Silverstone.png" },
    { round: 12, raceName: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", country: "Belgium", city: "Spa", date: "2026-07-19", time: "13:00:00Z", trackImg: "/circuits/f1_2024_bel_outline.png", bannerImg: "/track_schedule/Belgium.avif", circuitMap: "/f1_tracks/Belgium_Spa_Francorchamps.png" },
    { round: 13, raceName: "Hungarian Grand Prix", circuit: "Hungaroring", country: "Hungary", city: "Budapest", date: "2026-07-26", time: "13:00:00Z", trackImg: "/circuits/f1_2024_hun_outline.png", bannerImg: "/track_schedule/Hungary.avif", circuitMap: "/f1_tracks/Hungary_Hungaroring.png" },
    { round: 14, raceName: "Dutch Grand Prix", circuit: "Circuit Zandvoort", country: "Netherlands", city: "Zandvoort", date: "2026-08-23", time: "13:00:00Z", isSprint: true, trackImg: "/circuits/f1_2024_nld_outline.png", bannerImg: "/track_schedule/Netherlands.avif", circuitMap: "/f1_tracks/Netherlands_Zandvoort.png" },
    { round: 15, raceName: "Italian Grand Prix", circuit: "Monza Circuit", country: "Italy", city: "Monza", date: "2026-09-06", time: "13:00:00Z", trackImg: "/circuits/f1_2024_ita_outline.png", bannerImg: "/track_schedule/Italy.avif", circuitMap: "/f1_tracks/Italy_Monza.png" },
    { round: 16, raceName: "Spanish Grand Prix", circuit: "Circuito de Madrid", country: "Spain", city: "Madrid", date: "2026-09-13", time: "13:00:00Z", trackImg: "/circuits/f1_2024_spn_outline.png", bannerImg: "/track_schedule/IFEMA_MADRID_PRENSA_005.avif", circuitMap: null },
    { round: 17, raceName: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", country: "Azerbaijan", city: "Baku", date: "2026-09-27", time: "11:00:00Z", trackImg: "/circuits/f1_2024_aze_outline.png", bannerImg: "/track_schedule/Azerbaijan.avif", circuitMap: "/f1_tracks/Azerbaijan_Baku.png" },
    { round: 18, raceName: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", country: "Singapore", city: "Singapore", date: "2026-10-11", time: "12:00:00Z", isSprint: true, trackImg: "/circuits/f1_2024_sgp_outline.png", bannerImg: "/track_schedule/Singapore.avif", circuitMap: "/f1_tracks/Singapore_Marina_Bay_Street.png" },
    { round: 19, raceName: "United States Grand Prix", circuit: "Circuit of the Americas", country: "USA", city: "Austin", date: "2026-10-25", time: "19:00:00Z", trackImg: "/circuits/f1_2024_usa_outline.png", bannerImg: "/track_schedule/USA.avif", circuitMap: "/f1_tracks/USA_Circuit_of_the_Americas.png" },
    { round: 20, raceName: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", country: "Mexico", city: "Mexico City", date: "2026-11-01", time: "20:00:00Z", trackImg: "/circuits/f1_2024_mex_outline.png", bannerImg: "/track_schedule/Mexico.avif", circuitMap: "/f1_tracks/Mexico_Hermanos_Rodriguez.png" },
    { round: 21, raceName: "São Paulo Grand Prix", circuit: "Interlagos Circuit", country: "Brazil", city: "São Paulo", date: "2026-11-08", time: "17:00:00Z", trackImg: "/circuits/f1_2024_bra_outline.png", bannerImg: "/track_schedule/Brazil.avif", circuitMap: "/f1_tracks/Brazil_Jose_Carlos_Pace.png" },
    { round: 22, raceName: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", country: "USA", city: "Las Vegas", date: "2026-11-21", time: "06:00:00Z", trackImg: "/circuits/f1_2024_lve_outline.png", bannerImg: "/track_schedule/Las Vegas.avif", circuitMap: "/f1_tracks/USA_Las_Vegas_Strip.png" },
    { round: 23, raceName: "Qatar Grand Prix", circuit: "Lusail International Circuit", country: "Qatar", city: "Lusail", date: "2026-11-29", time: "16:00:00Z", isSprint: true, trackImg: "/circuits/f1_2024_qat_outline.png", bannerImg: "/track_schedule/Qatar.avif", circuitMap: "/f1_tracks/Qatar_Lusail_International.png" },
    { round: 24, raceName: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", country: "UAE", city: "Abu Dhabi", date: "2026-12-06", time: "13:00:00Z", trackImg: "/circuits/f1_2024_abu_outline.png", bannerImg: "/track_schedule/Abu Dhabi.avif", circuitMap: "/f1_tracks/UAE_Abu_Dhabi_Yas_Marina.png" },
];
