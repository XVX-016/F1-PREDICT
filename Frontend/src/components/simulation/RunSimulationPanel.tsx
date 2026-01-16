import React from 'react';
import { Play, Lock, Unlock, Hash } from 'lucide-react';

interface RunSimulationPanelProps {
    isRunning: boolean;
    lockSeed: boolean;
    seed: number | null;
    onRun: () => void;
    onLockToggle: (locked: boolean) => void;
    onSeedChange: (seed: number | null) => void;
}

const RunSimulationPanel: React.FC<RunSimulationPanelProps> = ({
    isRunning,
    lockSeed,
    seed,
    onRun,
    onLockToggle,
    onSeedChange
}) => {
    return (
        <div className="bg-[#E10600]/10 border border-[#E10600]/20 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#E10600] uppercase tracking-widest">Execution Engine</h3>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-black/40 rounded border border-white/5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Iterations</span>
                    <span className="text-[10px] font-mono text-white font-bold">10,000</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Seed Locking */}
                <div className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onLockToggle(!lockSeed)}
                            className={`p-1.5 rounded transition-all ${lockSeed ? 'text-white bg-[#E10600]' : 'text-slate-500 bg-white/5'}`}
                        >
                            {lockSeed ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Lock Random Seed</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Ensure reproducibility</span>
                        </div>
                    </div>

                    {lockSeed && (
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-2 py-1 rounded">
                            <Hash size={10} className="text-[#E10600]" />
                            <input
                                type="number"
                                value={seed || ''}
                                onChange={(e) => onSeedChange(parseInt(e.target.value) || null)}
                                placeholder="42"
                                className="w-16 bg-transparent text-[11px] font-mono font-bold text-white outline-none focus:ring-0"
                            />
                        </div>
                    )}
                </div>

                {/* Run Button */}
                <button
                    className={`w-full group relative overflow-hidden py-4 rounded font-black uppercase tracking-widest transition-all ${isRunning
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-[#E10600] hover:bg-[#ff0700] text-white active:scale-[0.98] shadow-[0_0_20px_rgba(225,6,0,0.3)] hover:shadow-[0_0_30px_rgba(225,6,0,0.5)]'
                        }`}
                    onClick={onRun}
                    disabled={isRunning}
                >
                    {/* Progress bar effect if running */}
                    {isRunning && (
                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    )}

                    <div className="relative flex items-center justify-center gap-3">
                        {isRunning ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Executing...</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} fill="currentColor" />
                                <span>Run Simulation</span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            <p className="text-[9px] font-mono text-slate-600 uppercase leading-relaxed text-center">
                Statistical convergence achieved at N=10k. <br />
                Seed entropy: {lockSeed ? 'FIXED' : 'OS_RANDOM'}
            </p>
        </div>
    );
};

export default RunSimulationPanel;
