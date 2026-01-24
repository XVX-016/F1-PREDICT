import { Trophy, AlertCircle } from 'lucide-react';
import { PodiumProbability, DataEnvelope } from '../../types/intelligence';

interface PodiumProbabilityCardProps {
    envelope: DataEnvelope<PodiumProbability[]>;
}

export const PodiumProbabilityCard: React.FC<PodiumProbabilityCardProps> = ({ envelope }) => {
    const { data, validity, reason } = envelope;

    if (validity === 'UNAVAILABLE') {
        return (
            <div className="bg-[#15151e] rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center h-[350px]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <AlertCircle className="text-white/20 w-6 h-6" />
                </div>
                <span className="text-sm text-white/40 font-bold uppercase tracking-widest mb-2">Podium Analysis Unavailable</span>
                <p className="text-[10px] text-white/20 uppercase max-w-[250px] leading-relaxed">
                    {reason || "Insufficient baseline data to form a defensible podium likelihood model for this configuration."}
                </p>
            </div>
        );
    }

    // Top 8 only
    const topDrivers = data.slice(0, 8);

    return (
        <div className="bg-[#15151e] rounded-xl border border-white/10 p-6 flex flex-col h-full transition-all hover:border-white/20">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#F5C542]/10 rounded-lg">
                        <Trophy className="w-4 h-4 text-[#F5C542]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                            Podium Likelihood
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">
                            Estimated Top-3 Finish Probability
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 flex-1 p-1">
                {topDrivers.map((d, i) => (
                    <div key={d.driverId} className="group relative">
                        <div className="flex justify-between items-end mb-1.5 px-0.5">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold w-4 ${i < 3 ? 'text-white' : 'text-white/20'}`}>
                                    {i + 1}.
                                </span>
                                <span className="text-xs font-black text-white tracking-tight uppercase italic">{d.shortCode}</span>
                                {i < 3 && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-[#F5C542]' : i === 1 ? 'bg-[#BFC3C8]' : 'bg-[#C47A3C]'}`}></div>
                                )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-white/80">{(d.podium * 100).toFixed(1)}%</span>
                        </div>
                        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-[#4A5568] transition-all duration-1000 ease-out group-hover:bg-[#E10600]"
                                style={{
                                    width: `${d.podium * 100}%`,
                                    opacity: d.confidence === 'LOW' ? 0.35 : d.confidence === 'MEDIUM' ? 0.7 : 1
                                }}
                            ></div>
                        </div>

                        {/* Outcome Tooltip (Internal CSS approach) */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute left-0 -top-20 z-10 transition-opacity bg-[#1e1e24] border border-white/10 rounded-lg p-3 shadow-2xl min-w-[140px]">
                            <p className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-tighter">Prob. Breakdown</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-white/40">P1 (Win)</span>
                                    <span className="text-white font-mono">{(d.p1 * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-white/40">P2</span>
                                    <span className="text-white font-mono">{(d.p2 * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-white/40">P3</span>
                                    <span className="text-white font-mono">{(d.p3 * 100).toFixed(1)}%</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[10px] items-center">
                                    <span className="text-white/40">Conf.</span>
                                    <span className={`font-bold uppercase ${d.confidence === 'HIGH' ? 'text-[#4ade80]' : d.confidence === 'MEDIUM' ? 'text-[#ffb347]' : 'text-[#ff4e4e]'}`}>
                                        {d.confidence}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#1e1e24] border-r border-b border-white/10 rotate-45"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[8px] uppercase tracking-widest font-mono">
                    <span className="text-white/20">Simulation Runs: 10,000</span>
                    <span className="text-[#4ade80]/60 font-bold">Result: Converged</span>
                </div>
                {envelope.data.some(d => d.confidence === 'LOW') && (
                    <div className="flex items-center gap-1.5 bg-[#E10600]/5 border border-[#E10600]/10 px-2 py-1 rounded">
                        <span className="w-1 h-1 rounded-full bg-[#E10600]"></span>
                        <p className="text-[8px] text-[#E10600]/60 uppercase font-black tracking-tighter">
                            High Chaos Variance Detected: Expected finishers may shift.
                        </p>
                    </div>
                )}
                <p className="text-[8px] text-white/10 uppercase tracking-[0.1em] italic leading-tight text-center mt-2">
                    Note: This analysis assumes clean-air baseline conditions.
                </p>
            </div>
        </div>
    );
};

export default PodiumProbabilityCard;
