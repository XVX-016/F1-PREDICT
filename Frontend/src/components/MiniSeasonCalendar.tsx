import React from 'react';
import GlassWrapper from './GlassWrapper';

interface RaceItem { id: string; name: string; startDate: string; }

interface MiniSeasonCalendarProps {
	races: RaceItem[];
	onViewFull?: () => void;
	onSelectRace?: (raceId: string) => void;
}

export default function MiniSeasonCalendar({ races, onViewFull, onSelectRace }: MiniSeasonCalendarProps) {
	return (
		<GlassWrapper className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-xl font-bold">2025 Season Mini Calendar</h3>
				<button onClick={onViewFull} className="text-sm bg-black/60 hover:bg-black/70 px-3 py-2 rounded-lg border border-white/20">View Full Season Predictions</button>
			</div>
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
				{races.map((r, idx) => (
					<button key={r.id} onClick={() => onSelectRace?.(r.id)} className="text-left bg-black/70 hover:bg-black/60 rounded-xl border border-white/10 p-3">
						<div className="text-xs text-gray-400 mb-1">R{idx + 1}</div>
						<div className="text-sm font-semibold text-gray-100 truncate">{r.name}</div>
						<div className="text-xs text-gray-400">{new Date(r.startDate).toLocaleDateString()}</div>
					</button>
				))}
			</div>
		</GlassWrapper>
	);
}


