export default function AboutPage() {
    return (
        <div className="min-h-screen relative pt-24 pb-16 px-6 text-textPrimary">
            <div className="bg-overlay" />

            <div className="relative z-10 max-w-5xl mx-auto space-y-16">
                <section className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                        About <span className="text-f1Red">F1-PREDICT</span>
                    </h1>
                    <p className="text-lg text-textSecondary leading-relaxed border-l-4 border-f1Red pl-6">
                        F1-PREDICT is a simulation-first Formula 1 strategy platform. It combines deterministic
                        race modeling, replay telemetry rendering, and inference-only intelligence summaries.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Platform Status</h2>
                    <div className="bg-slateDark border border-white/5 p-6">
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
                            <InfoBlock label="API" value="v2.0.0 (simulation-first)" />
                            <InfoBlock label="Simulation Engine" value="v3.0.0-engineering" />
                            <InfoBlock label="Intelligence Engine" value="v3.0.1-inference" />
                            <InfoBlock label="Replay Pipeline" value="Shared timeline, frame-aligned telemetry" />
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <h2 className="text-xl font-black uppercase tracking-[0.15em] text-white">System Design</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <PhilosophyCard
                            number="01"
                            title="Deterministic First"
                            description="Race logic is anchored in deterministic baseline behavior before probabilistic overlays are applied."
                        />
                        <PhilosophyCard
                            number="02"
                            title="Replay Integrity"
                            description="Replay telemetry is normalized to a shared timeline so every driver has frame-consistent samples."
                        />
                        <PhilosophyCard
                            number="03"
                            title="Inference Boundaries"
                            description="Intelligence mode is analytical and bounded. It does not execute full race simulation during briefing mode."
                        />
                        <PhilosophyCard
                            number="04"
                            title="Governed Artifacts"
                            description="Model params, gold datasets, and reports are versioned and validated through reproducible scripts."
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Capabilities</h2>
                    <div className="bg-carbon border border-slateMid/40 p-6 space-y-3 text-sm text-textSecondary">
                        <p>- Simulation page: run and compare strategy behavior with deterministic controls.</p>
                        <p>- Intelligence page: inference-first race briefing across 2026 schedule selections.</p>
                        <p>- Replay page: deterministic playback from generated telemetry cache and ranked driver positions.</p>
                        <p>- Fallback mode: frontend keeps operating when backend data is unavailable.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Data and Governance</h2>
                    <div className="bg-slateDark/50 border border-white/5 p-4 space-y-2 text-xs text-slate-300">
                        <p>- Rigorous parameter calibration and validation scripts are first-class project workflows.</p>
                        <p>- Gold dataset artifacts are built, audited, and frozen with checksums and manifest metadata.</p>
                        <p>- Replay telemetry ingestion uses shared timeline resampling to prevent desynchronization.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Current Limitations</h2>
                    <div className="bg-slateDark/50 border border-white/5 p-4 space-y-2 text-xs text-slate-400">
                        <p>- Replay availability depends on generated and uploaded telemetry cache per race.</p>
                        <p>- Intelligence outputs depend on currently available priors and season coverage.</p>
                        <p>- Some race/control interactions are approximated and not equivalent to FIA systems.</p>
                    </div>
                </section>

                <section className="pt-8 border-t border-slateMid/30">
                    <div className="bg-carbon/50 p-6 border border-white/5 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Project Links</h3>
                        <div className="text-xs text-slate-300 space-y-1">
                            <p>
                                GitHub: <a className="text-white hover:text-f1Red transition-colors" href="https://github.com/XVX-016/F1-PREDICT" target="_blank" rel="noreferrer noopener">https://github.com/XVX-016/F1-PREDICT</a>
                            </p>
                            <p>
                                Gold Dataset Spec: <a className="text-white hover:text-f1Red transition-colors" href="https://github.com/XVX-016/F1-PREDICT/blob/main/docs/gold_dataset_spec.md" target="_blank" rel="noreferrer noopener">docs/gold_dataset_spec.md</a>
                            </p>
                            <p>
                                Rigorous Governance: <a className="text-white hover:text-f1Red transition-colors" href="https://github.com/XVX-016/F1-PREDICT/blob/main/docs/rigorous_governance.md" target="_blank" rel="noreferrer noopener">docs/rigorous_governance.md</a>
                            </p>
                        </div>
                        <p className="text-[10px] text-slate-600 uppercase leading-loose tracking-wider">
                            Formula 1, F1, Grand Prix, and related marks are trademarks of Formula One Licensing B.V.
                            This project is independent and unaffiliated with the FIA or Formula 1 teams.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

function PhilosophyCard({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
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

function InfoBlock({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="bg-slateDark p-3 border border-white/5">
            <div className="text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-white">{value}</div>
        </div>
    );
}
