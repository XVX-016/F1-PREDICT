/**
 * AboutPage — Research-Grade System Overview
 * This is NOT a fan app.
 * This is a verifiable decision-support system.
 */

export default function AboutPage() {
    return (
        <div className="min-h-screen relative pt-24 pb-16 px-6 text-textPrimary">
            <div className="bg-overlay"></div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-20">

                {/* ================= HERO ================= */}
                <section className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                        About <span className="text-f1Red">F1-PREDICT</span>
                    </h1>

                    <p className="text-lg text-textSecondary leading-relaxed border-l-4 border-f1Red pl-6">
                        <strong>F1-PREDICT</strong> is a physics-first race simulation and
                        decision-support system for Formula 1 strategy analysis.
                        The project prioritizes <em>verifiability, reproducibility, and traceability</em>{' '}
                        over raw predictive performance.
                    </p>
                </section>

                {/* ============ WHAT THIS SYSTEM DOES ============ */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        What This System Does
                    </h2>

                    <div className="bg-slateDark border border-white/5 p-6 space-y-4">
                        <p className="text-sm text-textSecondary leading-relaxed">
                            F1-PREDICT simulates race evolution under multiple strategy hypotheses
                            using a deterministic physics baseline. Machine learning is used
                            strictly to estimate <strong>relative pace deltas</strong>, never
                            to predict race outcomes or winners.
                        </p>

                        <ul className="text-xs text-slate-400 space-y-1 font-mono">
                            <li>• Inputs: telemetry, tyre state, fuel load, grid context</li>
                            <li>• Outputs: pace deltas, degradation trends, strategy stability</li>
                            <li>• Explicit non-outputs: winners, podiums, betting signals</li>
                        </ul>
                    </div>
                </section>

                {/* ============ DESIGN PHILOSOPHY ============ */}
                <section className="space-y-8">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                        Design Philosophy
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <PhilosophyCard
                            number="01"
                            title="Physics First"
                            description="All simulations are anchored in deterministic tyre degradation, fuel burn, and pit-lane loss models. ML is used only to estimate bounded pace deltas relative to this baseline."
                        />

                        <PhilosophyCard
                            number="02"
                            title="Bounded Intelligence"
                            description="ML outputs are range-limited, uncertainty-aware, and rejected if residual variance exceeds historical bounds. A runtime switch allows physics-only execution."
                        />

                        <PhilosophyCard
                            number="03"
                            title="Reproducibility"
                            description="All stochastic components support explicit random-seed locking and deterministic Monte Carlo replay. Identical inputs always produce identical outputs."
                        />

                        <PhilosophyCard
                            number="04"
                            title="End-to-End Traceability"
                            description="Every number in the UI traces to a telemetry source, a feature snapshot, a versioned model, and a simulation seed."
                        />
                    </div>
                </section>

                {/* ============ ML (SUPPORTING COMPONENT) ============ */}
                <section className="space-y-6 pt-8 border-t border-slateMid/30">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Machine Learning (Supporting Component)
                    </h2>

                    <div className="bg-carbon border border-slateMid/40 p-6 space-y-4">
                        <p className="text-sm text-textSecondary leading-relaxed">
                            F1-PREDICT employs a <strong>LightGBM regressor</strong> to estimate
                            driver-specific pace deltas. The model is trained exclusively on
                            real telemetry data with grouped cross-validation by race to
                            prevent leakage.
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <InfoBlock label="Validation" value="GroupKFold by race_id" />
                            <InfoBlock label="Baselines" value="Zero-delta + global mean" />
                            <InfoBlock label="Synthetic Data" value="Disabled by default" danger />
                            <InfoBlock label="ML Toggle" value="use_ml=false available" />
                        </div>
                    </div>
                </section>

                {/* ============ FEATURE SET ============ */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Feature Set (Frozen v1)
                    </h2>

                    <p className="text-xs text-slate-500">
                        These features define the model’s maximum information surface.
                        Any change requires baseline comparison and version increment.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                        <FeatureTag name="avg_long_run_pace_ms" />
                        <FeatureTag name="tire_deg_rate" />
                        <FeatureTag name="sector_consistency" />
                        <FeatureTag name="clean_air_delta" />
                        <FeatureTag name="recent_form" />
                        <FeatureTag name="grid_position" />
                    </div>
                </section>

                {/* ============ INTENDED USE ============ */}
                <section className="space-y-6 pt-8 border-t border-slateMid/30">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                        Intended Use
                    </h2>

                    <p className="text-xs text-slate-500">
                        Intended audience: engineers, analysts, and ML practitioners exploring
                        constrained decision systems in motorsport contexts.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <UseBlock
                            title="What This Is"
                            color="green"
                            items={[
                                'Research prototype for strategy analysis',
                                'Systems engineering case study',
                                'Physics-constrained simulation design',
                                'Demonstrator for trustworthy ML'
                            ]}
                        />

                        <UseBlock
                            title="What This Is Not"
                            color="red"
                            items={[
                                'Not a betting or wagering platform',
                                'Not a race outcome predictor',
                                'Not an FIA-grade live system',
                                'Not trained to guess winners'
                            ]}
                        />
                    </div>
                </section>

                {/* ============ LIMITATIONS ============ */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Known Limitations
                    </h2>

                    <div className="bg-slateDark/50 border border-white/5 p-4 space-y-2 text-xs text-slate-400">
                        <p>• Strategy space is discretized, not continuous</p>
                        <p>• Multi-car interaction effects are approximated</p>
                        <p>• Wet race transitions are partially modeled</p>
                        <p>• Safety car timing is exogenous (sampled, not predicted)</p>
                    </div>

                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                        These limitations are documented and tested
                    </p>
                </section>

                {/* ============ LEGAL ============ */}
                <section className="pt-8 border-t border-slateMid/30">
                    <div className="bg-carbon/50 p-6 border border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                            Legal Attribution
                        </h3>

                        <p className="text-[10px] text-slate-600 uppercase leading-loose tracking-wider">
                            Formula 1, F1, Grand Prix, and related marks are trademarks of
                            Formula One Licensing B.V. This project is independent and not
                            affiliated with the FIA or any Formula 1 team. Data is used
                            strictly for academic and simulation validation purposes.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}

/* ================= COMPONENTS ================= */

function PhilosophyCard({
    number,
    title,
    description
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-slateDark border border-white/5 p-6 space-y-3">
            <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-f1Red/40">{number}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">{description}</p>
        </div>
    );
}

function FeatureTag({ name }: { name: string }) {
    return (
        <div className="bg-slateDark border border-white/5 px-3 py-2 text-slate-400">
            {name}
        </div>
    );
}

function InfoBlock({
    label,
    value,
    danger
}: {
    label: string;
    value: string;
    danger?: boolean;
}) {
    return (
        <div className="bg-slateDark p-3 border border-white/5">
            <div className="text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className={`font-mono ${danger ? 'text-f1Red' : 'text-white'}`}>
                {value}
            </div>
        </div>
    );
}

function UseBlock({
    title,
    color,
    items
}: {
    title: string;
    color: 'green' | 'red';
    items: string[];
}) {
    const colorClass = color === 'green' ? 'text-green-400' : 'text-f1Red';

    return (
        <div className="space-y-3">
            <h3 className={`text-sm font-bold uppercase tracking-widest ${colorClass}`}>
                {title}
            </h3>

            <ul className="space-y-2 text-sm text-textSecondary">
                {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <span className={`${colorClass} mt-1`}>
                            {color === 'green' ? '✓' : '✗'}
                        </span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
