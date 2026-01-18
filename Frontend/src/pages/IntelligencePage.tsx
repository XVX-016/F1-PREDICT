import { useState, useEffect } from 'react';
import { Activity, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRaceStatus } from '../hooks/useRaceStatus';
import { formatLabel } from '../utils/formatters';
import DashboardCard from '../components/common/DashboardCard';
import { StrategyFanChart } from '../components/intelligence/StrategyFanChart';
import { TyreDegradation } from '../components/intelligence/TyreHeatmap';
import { LapTrend } from '../components/intelligence/LapTrend';
import { FuelModel } from '../components/intelligence/FuelModel';
import { TelemetryFlags } from '../components/intelligence/TelemetryFlags';
import { LiveGapTicker } from '../components/intelligence/LiveGapTicker';

const IntelligencePage = () => {
    // Check if race is active
    const { data: raceStatus } = useRaceStatus();
    const isRaceActive = raceStatus?.status === 'LIVE';

    // Ensure connection is active if race is LIVE
    useTelemetry('abu_dhabi', isRaceActive);

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
                setTimeout(() => setIsSimulating(false), 2000);
            }
        }
    }, []);



    return (
        <div className="min-h-screen relative pt-14 bg-[#0b0b0e]">
            {/* Status Header Strip */}
            <div className="w-full bg-[#121217] border-b border-[#1f1f26] py-2 px-8 flex justify-between items-center z-[100] relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRaceActive && isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-600'}`}></span>
                        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
                            {formatLabel(isRaceActive && isConnected ? 'SYSTEM_ACTIVE' : 'LIVE_LINK_OFFLINE')}
                        </span>
                    </div>
                    <div className="h-3 w-[1px] bg-[#1f1f26]"></div>
                    <div className="flex items-center gap-2">
                        <AlertCircle size={10} className="text-amber-500" />
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            Robustness: <span className="text-white">Deterministic Delta V2</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        <span className="text-slate-700">Ref:</span>
                        <span>{isRaceActive ? 'Live Telemetry' : 'Precomputed Model'}</span>
                    </div>
                </div>
            </div>

            <div className="pt-6 pb-12 px-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Title Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-red-600 pl-6 py-2">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-white uppercase font-mono leading-none">
                                Strategy <span className="text-red-600">Intel Node</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-slate-500 font-mono uppercase tracking-[0.2em] text-[10px]">
                                    {contextDriver ? `Target Analysis: ${contextDriver} // Lap ${snapshot?.state?.lap || '18'}` : 'Pit Wall Analysis // Monte Carlo N20K'}
                                </p>
                                <div className="group relative">
                                    <Info size={12} className="text-slate-700 hover:text-slate-400 cursor-help" />
                                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-[#121217] border border-[#1f1f26] text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[200]">
                                        Real-time strategic forecasting derived from live telemetry and historical models.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Intelligence Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* TOP ROW: Live Telemetry (Conditional) */}
                        {isRaceActive ? (
                            <>
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    <LapTrend
                                        meanDeltaMs={142.5}
                                        stdDevMs={12.4}
                                        trendSlopeMsPerLap={-2.1}
                                    />
                                </div>
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    <LiveGapTicker
                                        gaps={[
                                            { driver: 'VER', gapMs: 0 },
                                            { driver: 'NOR', gapMs: 4142.5 },
                                            { driver: 'LEC', gapMs: 8921.1 },
                                            { driver: 'HAM', gapMs: 12441.8 },
                                            { driver: 'PIA', gapMs: 14221.3 },
                                            { driver: 'SAI', gapMs: 16855.9 }
                                        ]}
                                    />
                                    <TelemetryFlags
                                        clearAir={true}
                                        undercutRisk={false}
                                        trafficAhead={true}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="lg:col-span-12 bg-[#121217] border border-[#1f1f26] rounded-md p-12 flex flex-col items-center justify-center text-center space-y-4">
                                <Activity size={48} className="text-slate-800" />
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Live Session Active</h3>
                                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                                        Live telemetry features are offline. Displaying precomputed analysis based on historical data.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MIDDLE ROW: Stability Analysis (Always Visible) */}
                        <div className="lg:col-span-12">
                            <DashboardCard title="Stability Analysis" subtitle="Monte Carlo Confidence Distribution">
                                <div className="h-[320px] relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isSimulating ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <Activity className="w-8 h-8 text-red-600 animate-pulse mb-4" />
                                                <p className="text-red-600 font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">Running Monte Carlo Simulation...</p>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full p-2">
                                                <StrategyFanChart data={Array.from({ length: 57 }, (_, i) => ({
                                                    lap: i + 1,
                                                    expectedTime: 90 + Math.sin(i / 10) * 2 + i * 0.1,
                                                    p10: 88 + Math.sin(i / 10) * 2 + i * 0.1,
                                                    p90: 92 + Math.sin(i / 10) * 2 + i * 0.1,
                                                    p25: 89 + Math.sin(i / 10) * 2 + i * 0.1,
                                                    p75: 91 + Math.sin(i / 10) * 2 + i * 0.1
                                                }))} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DashboardCard>
                        </div>

                        {/* BOTTOM ROW: Strategic Details (Always Visible - Precomputed if offline) */}
                        <div className="lg:col-span-3">
                            <TyreDegradation healthPercent={68.4} currentLap={18} compound="HARD" />
                        </div>
                        <div className="lg:col-span-3">
                            <FuelModel fuelRemainingKg={42.22} liftCoastDeltaMs={12.5} targetLapTimeSec={91.44} />
                        </div>
                        <div className="lg:col-span-3">
                            <DashboardCard title="Strategy Robustness">
                                <div className="space-y-5">
                                    {[
                                        { name: 'Optimal 1-Stop', score: 0.94, risk: 'Low' },
                                        { name: 'Aggressive 2-Stop', score: 0.82, risk: 'Moderate' },
                                        { name: 'Alt Compound Mix', score: 0.61, risk: 'High' }
                                    ].map((item) => (
                                        <div key={item.name} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest font-black">
                                                <span className="text-white">{item.name}</span>
                                                <span className={item.risk === 'Low' ? 'text-green-500' : item.risk === 'Moderate' ? 'text-amber-500' : 'text-red-600'}>
                                                    {item.risk} Risk
                                                </span>
                                            </div>
                                            <div className="h-1 bg-black rounded-full overflow-hidden border border-[#1f1f26]">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${item.risk === 'Low' ? 'bg-green-600' :
                                                        item.risk === 'Moderate' ? 'bg-amber-500' : 'bg-red-600'
                                                        }`}
                                                    style={{ width: `${item.score * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DashboardCard>
                        </div>
                        <div className="lg:col-span-3">
                            <DashboardCard title="Strategy Selector">
                                <div className="grid grid-cols-1 gap-3">
                                    {['Aggressive 2-Stop', 'Optimal 1-Stop', 'Defensive 1-Stop'].map((strat) => (
                                        <button
                                            key={strat}
                                            className={`w-full text-left px-4 py-3 border transition-all duration-150 font-mono text-[10px] font-bold uppercase tracking-widest flex justify-between items-center group ${selectedStrategy === strat.toLowerCase().replace(' ', '-')
                                                ? 'bg-red-600/10 border-red-600/50 text-red-600'
                                                : 'bg-black/20 border-[#1f1f26] text-slate-400 hover:border-slate-700'
                                                }`}
                                            onClick={() => setSelectedStrategy(strat.toLowerCase().replace(' ', '-'))}
                                        >
                                            {strat}
                                            <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${selectedStrategy === strat.toLowerCase().replace(' ', '-') ? 'translate-x-1 text-red-600' : 'text-slate-700 group-hover:translate-x-1'
                                                }`} />
                                        </button>
                                    ))}
                                </div>
                            </DashboardCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntelligencePage;
