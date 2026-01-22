import { useState } from 'react';
import RaceContextHeader from '../components/intelligence/RaceContextHeader';
import ScenarioControls from '../components/simulation/ScenarioControls';
import AuditAndStressPanel from '../components/simulation/AuditAndStressPanel';
import WhyNotStrategyPanel from '../components/simulation/WhyNotStrategyPanel';
import WinProbabilityChart from '../components/charts/WinProbabilityChart';
import ConfidenceDecayChart from '../components/charts/ConfidenceDecayChart';

/**
 * Simulation Page (Professional Version - Phase 5)
 * Three-panel layout: Controls (30%) | Results (50%) | Audit (20%)
 */
const SimulationPagePro = () => {
    // Simulation State
    const [weather, setWeather] = useState<'Dry' | 'Damp' | 'Wet'>('Dry');
    const [scRiskBias, setSCRiskBias] = useState(15);
    const [chaosLevel, setChaosLevel] = useState(20);
    const [stressLevel, setStressLevel] = useState(0);
    const [showAssumptions, setShowAssumptions] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [hasResults, setHasResults] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

    // Mock results data
    const winProbData = [
        { driver: 'VER', probability: 0.42, error: 0.08 },
        { driver: 'NOR', probability: 0.22, error: 0.06 },
        { driver: 'LEC', probability: 0.14, error: 0.05 },
        { driver: 'HAM', probability: 0.09, error: 0.04 },
        { driver: 'SAI', probability: 0.06, error: 0.03 },
        { driver: 'RUS', probability: 0.04, error: 0.02 },
        { driver: 'ALO', probability: 0.02, error: 0.01 },
        { driver: 'PER', probability: 0.01, error: 0.01 },
    ];

    const confidenceDecayData = Array.from({ length: 53 }, (_, i) => ({
        lap: i + 1,
        confidence: 0.95 - (i / 53) * 0.45 - Math.random() * 0.05
    }));

    const strategies = [
        { name: '1-Stop S-H (L20)', winPct: 24, podiumPct: 61, avgFinish: 3.4, riskScore: 'Low' },
        { name: '2-Stop S-M-S (L15, L38)', winPct: 28, podiumPct: 64, avgFinish: 3.2, riskScore: 'High' },
        { name: '1-Stop M-H (L25)', winPct: 18, podiumPct: 52, avgFinish: 4.1, riskScore: 'Low' },
    ];

    const whyNotReasons = [
        { type: 'risk' as const, message: 'Overexposed to late SC — 35% chance of field reset after L45' },
        { type: 'assumption' as const, message: 'Requires ≥2s/lap pace advantage which current model does not support' },
        { type: 'data' as const, message: 'Restart skill below field median (P65 in historical restarts)' },
    ];

    const handleRunSimulation = async () => {
        setIsRunning(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsRunning(false);
        setHasResults(true);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-page)]">
            <RaceContextHeader
                raceName="Japanese Grand Prix 2025"
                session="Pre-Race"
                modelConfidence={3}
                lastCalibrated="3 races ago"
            />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-4">
                    {/* LEFT PANEL - Controls (30%) */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <ScenarioControls
                            weather={weather}
                            scRiskBias={scRiskBias}
                            chaosLevel={chaosLevel}
                            onWeatherChange={setWeather}
                            onSCRiskChange={setSCRiskBias}
                            onChaosChange={setChaosLevel}
                        />

                        {/* Strategy Controls */}
                        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Strategy Controls</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                        Aggression Level
                                    </label>
                                    <div className="flex gap-2">
                                        {['Conservative', 'Balanced', 'Aggressive'].map((level) => (
                                            <button
                                                key={level}
                                                className="flex-1 px-2 py-1.5 text-xs font-medium rounded border bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Model Toggles */}
                        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Model Toggles</h3>
                            <div className="space-y-2">
                                {[
                                    { id: 'ml', label: 'ML Pace Adjustment', tooltip: 'Adds variance, not guaranteed performance gain' },
                                    { id: 'restart', label: 'Restart Skill', tooltip: 'Per-driver SC restart performance' },
                                    { id: 'bayesian', label: 'Bayesian Sharing', tooltip: 'Team-level prior sharing' },
                                ].map((toggle) => (
                                    <label key={toggle.id} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="rounded border-[var(--border-strong)] accent-[var(--accent-red)]" />
                                        <span className="text-xs text-[var(--text-secondary)]">{toggle.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Run Button */}
                        <button
                            onClick={handleRunSimulation}
                            disabled={isRunning}
                            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${isRunning
                                ? 'bg-[var(--text-muted)] cursor-wait'
                                : 'bg-[var(--accent-red)] hover:bg-red-700'
                                }`}
                        >
                            {isRunning ? 'Running 10,000 iterations...' : 'RUN SIMULATION'}
                        </button>
                    </div>

                    {/* CENTER PANEL - Results (50%) */}
                    <div className="col-span-12 lg:col-span-6 space-y-4">
                        {!hasResults ? (
                            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-12 text-center">
                                <p className="text-[var(--text-muted)]">
                                    Configure parameters and run simulation to see results
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Win Probability */}
                                <WinProbabilityChart data={winProbData} highlightDriver="VER" />

                                {/* Strategy Comparison Table */}
                                <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] overflow-hidden">
                                    <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Strategy Comparison</h3>
                                        <p className="text-xs text-[var(--text-caption)]">Click a row to see "Why NOT" analysis</p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-[var(--bg-panel)] text-left">
                                                <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Strategy</th>
                                                <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Win %</th>
                                                <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Podium %</th>
                                                <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Avg Finish</th>
                                                <th className="px-4 py-2 font-medium text-[var(--text-secondary)]">Risk</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {strategies.map((s) => (
                                                <tr
                                                    key={s.name}
                                                    onClick={() => setSelectedStrategy(s.name)}
                                                    className={`border-t border-[var(--border-subtle)] cursor-pointer transition-colors ${selectedStrategy === s.name
                                                        ? 'bg-[var(--accent-red-light)]'
                                                        : 'hover:bg-[var(--bg-panel)]'
                                                        }`}
                                                >
                                                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">{s.name}</td>
                                                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.winPct}%</td>
                                                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.podiumPct}%</td>
                                                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">P{s.avgFinish}</td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${s.riskScore === 'Low'
                                                            ? 'bg-[var(--state-green-bg)] text-[var(--state-green)]'
                                                            : 'bg-[var(--state-red-bg)] text-[var(--state-red)]'
                                                            }`}>
                                                            {s.riskScore}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Why NOT Panel */}
                                {selectedStrategy && (
                                    <WhyNotStrategyPanel
                                        strategyName={selectedStrategy}
                                        reasons={whyNotReasons}
                                        isOpen={true}
                                        onToggle={() => setSelectedStrategy(null)}
                                    />
                                )}

                                {/* Confidence Decay */}
                                <ConfidenceDecayChart data={confidenceDecayData} currentLap={15} />
                            </>
                        )}
                    </div>

                    {/* RIGHT PANEL - Audit (20%) */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <AuditAndStressPanel
                            stressLevel={stressLevel}
                            showAssumptions={showAssumptions}
                            onStressChange={setStressLevel}
                            onAssumptionsToggle={() => setShowAssumptions(!showAssumptions)}
                            verdict={stressLevel < 10 ? 'Robust' : stressLevel < 20 ? 'Sensitive' : 'Unstable'}
                            flipCauses={stressLevel > 15 ? ['sc_probability=0.3', 'tyre_deg=1.2'] : []}
                        />

                        {/* Metadata */}
                        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)] shadow-[var(--shadow-card)] p-4">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Run Metadata</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">Iterations</span>
                                    <span className="text-[var(--text-secondary)] font-mono">10,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">Seed</span>
                                    <span className="text-[var(--text-secondary)] font-mono">42</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">Runtime</span>
                                    <span className="text-[var(--text-secondary)] font-mono">2.3s</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SimulationPagePro;
