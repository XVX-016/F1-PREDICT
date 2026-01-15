import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, ChevronRight, Terminal as TerminalIcon } from 'lucide-react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useTelemetry } from '../hooks/useTelemetry';

const IntelligencePage = () => {
    // Ensure connection is active
    useTelemetry('abu_dhabi_2024', true);

    const { isConnected, snapshot } = useTelemetryStore();
    const [selectedStrategy, setSelectedStrategy] = useState('one-stop');

    // Deep Pull Context State
    const [contextDriver, setContextDriver] = useState<string | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        // Parse Hash Params manually since we use hash routing
        const hash = window.location.hash;
        if (hash.includes('?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const driver = params.get('driver');
            if (driver) {
                setContextDriver(driver);
                setIsSimulating(true);
                // Trigger Deep Pull Simulation here
                setTimeout(() => setIsSimulating(false), 2000); // Mock simulation delay
            }
        }
    }, []);

    return (
        <div className="min-h-screen relative pt-14">
            {/* Simulation Disclaimer Strip */}
            <div className="w-full bg-slateDark/90 border-b border-white/5 py-1.5 px-8 flex justify-between items-center z-[100] relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E10600] animate-pulse"></span>
                        <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Simulation Mode</span>
                    </div>
                    <div className="h-4 w-[1px] bg-slate-700"></div>
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                        Strategy robustness scores derived from <span className="text-[#E10600] font-bold">deterministic lap-time delta models</span>.
                    </p>
                </div>
                <div className="flex gap-4">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-2 py-0.5 border border-slate-800 rounded-xs bg-black/20">MODEL OUTPUT</span>
                    <span className="hidden md:block text-[9px] font-mono text-slate-600 uppercase">INDEPENDENT TECHNICAL ANALYSIS</span>
                </div>
            </div>

            <div className="pt-16 pb-12 px-6 overflow-x-hidden">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                                STRATEGY <span className="text-red-600">INTEL</span>
                            </h1>
                            <p className="text-gray-500 mt-2 font-mono uppercase tracking-widest text-xs">
                                {contextDriver ? `Target Analysis: ${contextDriver} // Lap ${snapshot?.state?.lap || '18'}` : 'Race Intelligence Pit Wall // Monte Carlo Analysis Engine'}
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <motion.div
                                className={`px-6 py-2 rounded-lg font-mono text-xs font-bold border transition-all duration-300 flex items-center gap-2 ${isConnected ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-white/5 border-white/10 text-gray-500'
                                    }`}
                            >
                                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}></span>
                                {isConnected ? 'LIVE TELEMETRY ACTIVE' : 'TELEMETRY DISCONNECTED'}
                            </motion.div>
                        </div>
                    </div>

                    {/* Dashboard Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Visualization Center */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Strategy Fan Chart Placeholder */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 aspect-video relative group overflow-hidden">
                                {isSimulating && (
                                    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                                        <Activity className="w-8 h-8 text-red-500 animate-pulse mb-4" />
                                        <p className="text-red-500 font-mono text-sm uppercase tracking-widest animate-pulse">Running Monte Carlo Simulation...</p>
                                        <p className="text-gray-500 font-mono text-xs mt-2">Target: {contextDriver}</p>
                                    </div>
                                )}
                                <div className="absolute top-4 left-6 z-10">
                                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-tighter flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-red-500" />
                                        Strategy Stability Distribution
                                    </h3>
                                </div>
                                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-gray-600 font-mono text-sm uppercase">D3.js Strategy Stability Graph Incoming</p>
                                    {/* D3 Fan Chart will be injected here */}
                                </div>
                            </div>

                            {/* Control Panel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-tighter mb-4">Strategy Selector</h3>
                                    <div className="space-y-2">
                                        {['Aggressive 2-Stop', 'Optimal 1-Stop', 'Defensive 1-Stop'].map((strat) => (
                                            <button
                                                key={strat}
                                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 font-mono text-sm flex justify-between items-center group ${selectedStrategy === strat.toLowerCase().replace(' ', '-')
                                                    ? 'bg-red-600/10 border-red-600/50 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                    }`}
                                                onClick={() => setSelectedStrategy(strat.toLowerCase().replace(' ', '-'))}
                                            >
                                                {strat}
                                                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${selectedStrategy === strat.toLowerCase().replace(' ', '-') ? 'translate-x-1 text-red-500' : 'text-gray-600 group-hover:translate-x-1'
                                                    }`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-mono text-gray-400 uppercase tracking-tighter mb-4">Sim Settings</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase mb-1">
                                                <span>Iterations</span>
                                                <span>20,000</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-600 w-4/5"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase mb-1">
                                                <span>Confidence Interval</span>
                                                <span>95%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-600 w-[95%]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Side Sidebar: Telemetry & Rankings */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Live Telemetry Terminal */}
                            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-[400px]">
                                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="text-sm font-mono text-white uppercase tracking-tighter flex items-center gap-2">
                                        <TerminalIcon className="w-4 h-4 text-green-500" />
                                        Physics Terminal
                                    </h3>
                                    <span className="text-[10px] font-mono text-green-500/50 animate-pulse">SYSTEM_ACTIVE</span>
                                </div>
                                <div className="flex-1 p-4 font-mono text-[11px] overflow-hidden space-y-1">
                                    <p className="text-green-500/70">[09:21:44] INITIALIZING MONTE CARLO SAMPLED ENGINE...</p>
                                    <p className="text-gray-500">[09:21:45] LOADING TYRE_MODEL_V2.1 (EXPONENTIAL_DECAY)</p>
                                    <p className="text-gray-500">[09:21:45] LOADING FUEL_BURN_MODEL (LINEAR_PENALTY)</p>
                                    <p className="text-white"> &gt; UPDATING LIVE_RACE_STATE: LAP_18/57</p>
                                    <p className="text-red-500"> &gt; WARNING: SC_PROBABILITY INCREASED (0.12 -&gt; 0.28)</p>
                                    <p className="text-gray-500">[09:21:46] SAMPLING STRATEGY_OPTIMIZER...</p>
                                    <div className="mt-4 border-t border-white/5 pt-4">
                                        <p className="text-white font-bold tracking-widest uppercase">Live Metrics</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="bg-white/5 p-2 rounded">
                                                <p className="text-[9px] text-gray-500">REF_PACE</p>
                                                <p className="text-xs text-white">1:31.442</p>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded">
                                                <p className="text-[9px] text-gray-500">FUEL_REM</p>
                                                <p className="text-xs text-white">42.2kg</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Robustness Rankings */}
                            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-mono text-gray-400 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    Strategy Robustness
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Optimal 1-Stop', score: 0.94, risk: 'Low' },
                                        { name: 'Aggressive 2-Stop', score: 0.82, risk: 'Medium' },
                                        { name: 'Alt Compound Mix', score: 0.61, risk: 'High' }
                                    ].map((item) => (
                                        <div key={item.name}>
                                            <div className="flex justify-between text-xs font-mono mb-1">
                                                <span className="text-white">{item.name}</span>
                                                <span className={item.risk === 'Low' ? 'text-green-500' : item.risk === 'Medium' ? 'text-yellow-500' : 'text-red-500'}>
                                                    {item.risk} Risk
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${item.risk === 'Low' ? 'bg-green-500' : item.risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${item.score * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntelligencePage;
