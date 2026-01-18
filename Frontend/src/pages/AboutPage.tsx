/**
 * AboutPage - Research-Grade Academic Presentation
 * This is NOT a fan app - it's a verifiable decision system.
 */

export default function AboutPage() {
    return (
        <div className="min-h-screen relative pt-24 pb-12 px-6 text-textPrimary">
            <div className="bg-overlay"></div>
            <div className="relative z-10 max-w-4xl mx-auto space-y-16">

                {/* Hero Section */}
                <section className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-white">
                        About <span className="text-f1Red">F1-PREDICT</span>
                    </h1>
                    <p className="text-lg text-textSecondary leading-relaxed border-l-4 border-f1Red pl-6">
                        <strong>F1-PREDICT</strong> is a physics-first race simulation and decision-support
                        system for Formula 1 strategy analysis. The project prioritizes{' '}
                        <em>verifiability, reproducibility, and traceability</em> over raw predictive performance.
                    </p>
                </section>

                {/* Design Philosophy */}
                <section className="space-y-8">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                        Design Philosophy
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <PhilosophyCard
                            number="01"
                            title="Physics First"
                            description="All race simulations are anchored in deterministic models of tyre degradation, fuel burn, and pit-lane loss. ML is used only to estimate pace deltas relative to a physics baseline — never to predict outcomes directly."
                        />
                        <PhilosophyCard
                            number="02"
                            title="Bounded Intelligence"
                            description="ML outputs are explicitly constrained: pace deltas are range-limited, uncertainty bands are derived from residual distributions, and a runtime kill-switch allows physics-only execution."
                        />
                        <PhilosophyCard
                            number="03"
                            title="Reproducibility"
                            description="All stochastic components support explicit random seed locking and deterministic Monte Carlo replay. Identical inputs and seeds always produce identical outputs."
                        />
                        <PhilosophyCard
                            number="04"
                            title="End-to-End Traceability"
                            description="Every number in the UI traces to: a telemetry source (FastF1/Ergast), a feature snapshot in Supabase, a versioned ML model, and a simulation seed."
                        />
                    </div>
                </section>

                {/* ML Methodology */}
                <section className="space-y-6 pt-8 border-t border-slateMid/30">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                        Machine Learning Methodology
                    </h2>

                    <div className="bg-carbon border border-slateMid/40 p-6 space-y-4">
                        <p className="text-sm text-textSecondary leading-relaxed">
                            F1-PREDICT employs a <strong>LightGBM regressor</strong> to estimate driver-specific
                            pace deltas. The model is trained exclusively on real telemetry data with grouped
                            cross-validation by race to prevent leakage.
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="bg-slateDark p-3 border border-white/5">
                                <div className="text-slate-500 uppercase tracking-widest mb-1">Validation</div>
                                <div className="text-white font-mono">GroupKFold by race_id</div>
                            </div>
                            <div className="bg-slateDark p-3 border border-white/5">
                                <div className="text-slate-500 uppercase tracking-widest mb-1">Baselines</div>
                                <div className="text-white font-mono">Zero-delta + Global mean</div>
                            </div>
                            <div className="bg-slateDark p-3 border border-white/5">
                                <div className="text-slate-500 uppercase tracking-widest mb-1">Synthetic Data</div>
                                <div className="text-f1Red font-mono">DISABLED by default</div>
                            </div>
                            <div className="bg-slateDark p-3 border border-white/5">
                                <div className="text-slate-500 uppercase tracking-widest mb-1">ML Toggle</div>
                                <div className="text-white font-mono">use_ml=false available</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features (Frozen) */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Features (Frozen V1)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                        <FeatureTag name="avg_long_run_pace_ms" />
                        <FeatureTag name="tire_deg_rate" />
                        <FeatureTag name="sector_consistency" />
                        <FeatureTag name="clean_air_delta" />
                        <FeatureTag name="recent_form" />
                        <FeatureTag name="grid_position" />
                    </div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                        No new features without baseline comparison and version bump
                    </p>
                </section>

                {/* Intended Use */}
                <section className="space-y-6 pt-8 border-t border-slateMid/30">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">
                        Intended Use
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">
                                What This Is
                            </h3>
                            <ul className="space-y-2 text-sm text-textSecondary">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Research prototype for strategy analysis</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Systems engineering case study</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Physics-constrained simulation design</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Demonstrator for trustworthy ML</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-f1Red uppercase tracking-widest">
                                What This Is Not
                            </h3>
                            <ul className="space-y-2 text-sm text-textSecondary">
                                <li className="flex items-start gap-2">
                                    <span className="text-f1Red mt-1">✗</span>
                                    <span>Not a betting or wagering platform</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-f1Red mt-1">✗</span>
                                    <span>Not a race outcome predictor</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-f1Red mt-1">✗</span>
                                    <span>Not a real-time FIA-grade system</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-f1Red mt-1">✗</span>
                                    <span>Not trained to guess winners</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Limitations */}
                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                        Known Limitations
                    </h2>
                    <div className="bg-slateDark/50 border border-white/5 p-4 space-y-2 text-xs text-slate-400">
                        <p>• Strategy space is discretized, not continuous</p>
                        <p>• Multi-car interaction effects are approximated</p>
                        <p>• Wet race transitions not fully modeled</p>
                        <p>• Safety car timing is exogenous (sampled, not predicted)</p>
                    </div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">
                        These limitations are documented and tested
                    </p>
                </section>

                {/* Legal Disclaimer */}
                <section className="pt-8 border-t border-slateMid/30">
                    <div className="bg-carbon/50 p-6 border border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                            Legal Attribution
                        </h3>
                        <p className="text-[10px] text-slate-600 uppercase leading-loose tracking-wider">
                            Formula 1, F1, Grand Prix, and related marks are trademarks of Formula One Licensing B.V.
                            This project is independent and is not affiliated with, sponsored by, or endorsed
                            by the Formula 1 group of companies, the FIA, or any individual Formula 1 team.
                            All data is used for academic investigation and simulation validation purposes.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}

function PhilosophyCard({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="bg-slateDark border border-white/5 p-6 space-y-3">
            <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-f1Red/40">{number}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
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
