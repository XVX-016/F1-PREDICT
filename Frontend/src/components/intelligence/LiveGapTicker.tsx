import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';

export const LiveGapTicker: React.FC<{ raceId: string }> = ({ raceId }) => {
    const { snapshot, isConnected } = useTelemetry(raceId, true);

    // Mock gaps if no snapshot for demonstration
    const drivers = snapshot?.drivers || {
        'VER': { gap: 0.000, tyre_age: 12, compound: 'HARD', last_lap: '1:31.442' },
        'NOR': { gap: 4.142, tyre_age: 12, compound: 'HARD', last_lap: '1:31.851' },
        'LEC': { gap: 8.921, tyre_age: 15, compound: 'MEDIUM', last_lap: '1:32.112' },
        'HAM': { gap: 12.441, tyre_age: 14, compound: 'MEDIUM', last_lap: '1:32.440' }
    };

    return (
        <div className="bg-red-600/10 border-y border-red-500/20 py-2 overflow-hidden whitespace-nowrap bg-black backdrop-blur-md">
            <div className="flex items-center gap-8 animate-marquee">
                <div className="flex items-center gap-2 text-red-500 font-mono text-[10px] font-bold uppercase tracking-widest border-r border-white/10 pr-8">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Live Interval Data
                </div>

                {Object.entries(drivers).map(([id, data]) => (
                    <div key={id} className="flex items-center gap-3 font-mono">
                        <span className="text-white font-black">{id}</span>
                        <span className="text-gray-500">+{data.gap.toFixed(3)}s</span>
                        <div className={`text-[9px] px-1 rounded ${data.compound === 'SOFT' ? 'bg-red-500/20 text-red-500' :
                                data.compound === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-white/10 text-white/50'
                            }`}>
                            {data.compound[0]}
                        </div>
                    </div>
                ))}

                {/* Second set for seamless loop */}
                {Object.entries(drivers).map(([id, data]) => (
                    <div key={`${id}-copy`} className="flex items-center gap-3 font-mono">
                        <span className="text-white font-black">{id}</span>
                        <span className="text-gray-500">+{data.gap.toFixed(3)}s</span>
                        <div className={`text-[9px] px-1 rounded ${data.compound === 'SOFT' ? 'bg-red-500/20 text-red-500' :
                                data.compound === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-white/10 text-white/50'
                            }`}>
                            {data.compound[0]}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    display: flex;
                    width: max-content;
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};
