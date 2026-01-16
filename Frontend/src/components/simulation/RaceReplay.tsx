import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Circle } from 'lucide-react';

interface LapData {
    lap: number;
    is_sc: boolean;
    drivers: Record<string, {
        lap_time: number;
        total_time: number;
        compound: string;
        tyre_age: number;
        is_pit?: boolean;
    }>;
}

interface RaceReplayProps {
    trace: LapData[] | null;
}

const RaceReplay: React.FC<RaceReplayProps> = ({ trace }) => {
    const [currentLapIdx, setCurrentLapIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isPlaying && trace && currentLapIdx < trace.length - 1) {
            interval = setInterval(() => {
                setCurrentLapIdx(prev => prev + 1);
            }, 500);
        } else {
            setIsPlaying(false);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentLapIdx, trace]);

    if (!trace) return null;

    const currentLap = trace[currentLapIdx];
    const sortedDrivers = Object.entries(currentLap.drivers)
        .sort((a, b) => a[1].total_time - b[1].total_time);

    return (
        <div className="bg-slate-900/30 border border-white/5 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 border-l-2 border-[#E10600] pl-3 uppercase tracking-widest">
                    Race Replay <span className="text-slate-600 ml-2">Lap {currentLap.lap}</span>
                </h3>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentLapIdx(prev => Math.max(0, prev - 1))}
                        className="p-1 hover:text-white text-slate-500 transition-colors"
                    ><SkipBack size={18} /></button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-[#E10600] text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </button>

                    <button
                        onClick={() => setCurrentLapIdx(prev => Math.min(trace.length - 1, prev + 1))}
                        className="p-1 hover:text-white text-slate-500 transition-colors"
                    ><SkipForward size={18} /></button>
                </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {sortedDrivers.map(([id, data], idx) => (
                    <div key={id} className="flex items-center gap-4 bg-black/20 p-2 rounded border border-white/5">
                        <div className="w-6 text-[10px] font-mono text-slate-500">{idx + 1}</div>
                        <div className={`w-8 font-bold text-sm ${id === 'VER' ? 'text-white' : 'text-slate-400'}`}>{id}</div>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                            {/* Visual gap to leader proxy */}
                            <div
                                className="absolute right-0 top-0 bottom-0 bg-[#E10600]/40 rounded-full"
                                style={{ width: `${Math.max(5, 100 - (idx * 5))}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold
                ${data.compound === 'Soft' ? 'border-red-500 text-red-500' :
                                    data.compound === 'Medium' ? 'border-yellow-500 text-yellow-500' : 'border-white/40 text-slate-400'}`}>
                                {data.compound[0]}
                            </div>
                            <div className="w-16 text-right font-mono text-[10px]">
                                {data.is_pit ? <span className="text-[#E10600] font-bold">PIT</span> : `${(data.lap_time / 1000).toFixed(3)}s`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {currentLap.is_sc && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 p-2 rounded flex items-center gap-2 text-yellow-500 text-[10px] font-bold uppercase tracking-widest">
                    <Circle size={12} fill="currentColor" />
                    Safety Car Deployed
                </div>
            )}
        </div>
    );
};

export default RaceReplay;
