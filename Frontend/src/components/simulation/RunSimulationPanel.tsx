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
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#1f1f26] pb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Execution Engine</h3>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Iterations</span>
                    <span className="text-[10px] font-mono text-white font-bold">10,000</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Seed Locking */}
                <div className="flex items-center justify-between p-3 bg-[#1f1f26] border border-[#2a2a35] rounded">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onLockToggle(!lockSeed)}
                            className={`p-1.5 rounded transition-all ${lockSeed ? 'text-white bg-red-600' : 'text-gray-500 bg-gray-800/20 uppercase font-mono text-[8px] border border-[#2a2a35]'}`}
                        >
                            {lockSeed ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">REPRODUCIBILITY</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Lock simulation seed</span>
                        </div>
                    </div>

                    {lockSeed && (
                        <div className="flex items-center gap-2 bg-black border border-[#2a2a35] px-2 py-1 rounded">
                            <Hash size={10} className="text-red-600" />
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
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-500 text-white active:scale-[0.98]'
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

            <p className="text-[9px] font-mono text-gray-600 uppercase leading-relaxed text-center">
                Statistical convergence at N=10k. <br />
                Entropy: {lockSeed ? 'FIXED_MODEL' : 'DETERMINISTIC_RANDOM'}
            </p>
        </div>
    );
};

export default RunSimulationPanel;
