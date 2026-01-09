import React, { useEffect, useState } from 'react';
import GlassWrapper from './GlassWrapper';
import CircuitFeaturesService from '../services/CircuitFeaturesService';

interface TrackOverviewProps {
	raceName: string;
	circuitName: string;
	laps: number;
	lengthKm: number;
	features: string[];
}

interface TrackFeatures {
	track: string;
	first_grand_prix: number;
	number_of_laps: number;
	circuit_length_km: number;
	race_distance_km: number;
	lap_record: {
		time: string;
		driver: string;
		year: number;
	};
	features: {
		corners: number;
		drs_zones: number;
		max_speed_kmh: number | null;
		notable_layout: string;
	};
}

const toCircuitImagePath = (raceName: string): string => {
	// Prefer detailed track images from public/f1_tracks
	const key = raceName.toLowerCase();
	if (key.includes('bahrain')) return '/f1_tracks/Bahrain_Bahrain_International.png';
	if (key.includes('saudi') || key.includes('jeddah')) return '/f1_tracks/Saudi_Arabia_Jeddah_Corniche.png';
	if (key.includes('australia') || key.includes('melbourne')) return '/f1_tracks/Australia_Albert_Park.png';
	if (key.includes('japan') || key.includes('suzuka')) return '/f1_tracks/Japan_Suzuka.png';
	if (key.includes('china') || key.includes('shanghai')) return '/f1_tracks/China_Shanghai_International.png';
	if (key.includes('miami')) return '/f1_tracks/USA_Miami_International.png';
	if (key.includes('emilia') || key.includes('imola')) return '/f1_tracks/Italy_Imola_Internazionale_Enzo_Dino_Ferrari.png';
	if (key.includes('monaco')) return '/f1_tracks/Monaco_Circuit_de_Monaco.png';
	if (key.includes('canada') || key.includes('montreal')) return '/f1_tracks/Canada_Gilles_Villeneuve.png';
	if (key.includes('spain') || key.includes('barcelona')) return '/f1_tracks/Spain_Barcelona_Catalunya.png';
	if (key.includes('austria') || key.includes('red bull ring')) return '/f1_tracks/Austria_Red_Bull_Ring.png';
	if (key.includes('british') || key.includes('silverstone') || key.includes('united kingdom') || key.includes('great britain')) return '/f1_tracks/Great_Britain_Silverstone.png';
	if (key.includes('hungary') || key.includes('hungaroring')) return '/f1_tracks/Hungary_Hungaroring.png';
	if (key.includes('belgium') || key.includes('spa')) return '/f1_tracks/Belgium_Spa_Francorchamps.png';
	if (key.includes('netherlands') || key.includes('dutch') || key.includes('zandvoort')) return '/f1_tracks/Netherlands_Zandvoort.png';
	if (key.includes('italy') && key.includes('monza')) return '/f1_tracks/Italy_Monza.png';
	if (key.includes('azerbaijan') || key.includes('baku')) return '/f1_tracks/Azerbaijan_Baku.png';
	if (key.includes('singapore')) return '/f1_tracks/Singapore_Marina_Bay_Street.png';
	if (key.includes('united states') || key.includes('austin')) return '/f1_tracks/USA_Circuit_of_the_Americas.png';
	if (key.includes('mexico')) return '/f1_tracks/Mexico_Hermanos_Rodriguez.png';
	if (key.includes('são paulo') || key.includes('brazil') || key.includes('interlagos')) return '/f1_tracks/Brazil_Jose_Carlos_Pace.png';
	if (key.includes('las vegas')) return '/f1_tracks/USA_Las_Vegas_Strip.png';
	if (key.includes('qatar') || key.includes('lusail')) return '/f1_tracks/Qatar_Lusail_International.png';
	if (key.includes('abu dhabi') || key.includes('yas') || key.includes('uae')) return '/f1_tracks/UAE_Abu_Dhabi_Yas_Marina.png';
	// Fallback to simplified outline if specific not found
	return '/circuits/f1_2024_aus_outline.png';
};

export default function TrackOverview({ raceName, circuitName, laps, lengthKm, features }: TrackOverviewProps) {
	const [trackData, setTrackData] = useState<TrackFeatures | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	
	console.log(`🔍 TrackOverview: Props received - raceName: ${raceName}, circuitName: ${circuitName}`);

	useEffect(() => {
		const loadTrackData = async () => {
			setIsLoading(true);
			console.log(`🔍 TrackOverview: Loading track data for race: ${raceName}`);
			const service = CircuitFeaturesService.getInstance();
			const data = service.findByRaceName(raceName);
			console.log(`🔍 TrackOverview: Track data result:`, data);
			setTrackData(data);
			setIsLoading(false);
		};

		loadTrackData();
	}, [raceName]);

	return (
		<GlassWrapper className="p-0 h-full overflow-hidden">
			{/* Top: Track image only (cropped) */}
			<div className="w-full bg-black overflow-hidden" style={{ height: '300px' }}>
				<img
					src={encodeURI(toCircuitImagePath(raceName))}
					alt={circuitName}
					className="w-full h-full object-cover"
					style={{ objectPosition: 'center 40%' }}
					onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
				/>
			</div>
			{/* Bottom: Track features only */}
			<div className="p-6">
				<h3 className="text-xl font-bold mb-3">Track Features</h3>
				{isLoading ? (
					<div className="text-sm text-gray-400">Loading track data...</div>
				) : trackData ? (
					<ul className="grid grid-cols-2 gap-2 text-sm text-gray-300">
						<li className="col-span-2">Circuit: {trackData.track}</li>
						<li>Laps: {trackData.number_of_laps}</li>
						<li>Length: {trackData.circuit_length_km.toFixed(3)} km</li>
						<li>Distance: {trackData.race_distance_km.toFixed(0)} km</li>
						<li>Corners: {trackData.features.corners}</li>
						<li>DRS Zones: {trackData.features.drs_zones}</li>
						{trackData.features.max_speed_kmh && (
							<li>Max Speed: {trackData.features.max_speed_kmh} km/h</li>
						)}
						<li className="col-span-2 text-xs text-gray-400 mt-2">
							{trackData.features.notable_layout}
						</li>
						<li className="col-span-2 text-xs text-gray-400">
							Lap Record: {trackData.lap_record.time} ({trackData.lap_record.driver}, {trackData.lap_record.year})
						</li>
					</ul>
				) : (
					<ul className="grid grid-cols-2 gap-2 text-sm text-gray-300">
						<li className="col-span-2">Circuit: {circuitName}</li>
						<li>Laps: {laps}</li>
						<li>Length: {lengthKm.toFixed(3)} km</li>
						{features.map((f) => (
							<li key={f}>{f}</li>
						))}
					</ul>
				)}
			</div>
		</GlassWrapper>
	);
}


