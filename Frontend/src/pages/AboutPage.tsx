

export default function AboutPage() {
    return (
        <div className="min-h-screen relative pt-24 pb-12 px-6 text-textPrimary">
            <div className="bg-overlay"></div>
            <div className="relative z-10 max-w-4xl mx-auto space-y-16">

                {/* Hero Section */}
                <section className="space-y-4">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">
                        Technical <span className="text-f1Red">Philosophy</span>
                    </h1>
                    <p className="text-xl text-textSecondary leading-relaxed border-l-4 border-f1Red pl-6">
                        F1 Race Intelligence is a personal engineering project dedicated to
                        deterministic race strategy simulation and Monte Carlo uncertainty propagation.
                        It is not a betting tool or a fan-engagement app, but a technical notebook
                        investigating the physics of modern Grand Prix racing.
                    </p>
                </section>

                {/* Data Architecture */}
                <section className="grid md:grid-cols-2 gap-12 pt-8 border-t border-slateMid/30">
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Live Data Sources</h2>
                        <div className="bg-carbon border border-slateMid/40 p-6 space-y-4">
                            <p className="text-xs text-textSecondary leading-relaxed italic">
                                Real-time technical metrics sourced via Jolpica/Ergast and FastF1 proxies.
                            </p>
                            <ul className="text-sm space-y-2 text-textPrimary font-mono">
                                <li className="flex items-center gap-2"><span className="text-f1Red">·</span> Session Timing</li>
                                <li className="flex items-center gap-2"><span className="text-f1Red">·</span> Lap Delta Matrix</li>
                                <li className="flex items-center gap-2"><span className="text-f1Red">·</span> Sector Segmentation</li>
                                <li className="flex items-center gap-2"><span className="text-f1Red">·</span> Local Meteorology</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Simulated Intelligence</h2>
                        <div className="bg-slateDark border border-[#E10600]/20 p-6 space-y-4">
                            <p className="text-xs text-[#E10600] leading-relaxed font-bold">
                                DETERMINISTIC PHYSICS MODELS
                            </p>
                            <p className="text-sm text-textPrimary leading-relaxed">
                                Strategy outcomes, tire degradation curves, and fuel penalty weights are
                                calculated using a proprietary simulation engine. Uncertainty is
                                quantified via 10,000+ Monte Carlo iterations per session.
                            </p>
                        </div>
                    </div>
                </section>

                {/* The "Why" */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Engineering vs. Hype</h2>
                    <div className="prose prose-invert max-w-none text-textSecondary space-y-6">
                        <p>
                            In an era dominated by "AI" hype and black-box predictions, this project takes
                            the opposite path. Every outcome you see on the <strong>Predict</strong> page
                            is traceable to a physical variable: brake temperature, rubber-on-track density,
                            ambient humidity, and aerodynamic wake.
                        </p>
                        <p>
                            We prioritize data density and factual hierarchy. Our interface is styled after
                            the "Pit-Wall" terminals used by race engineers—designed for immediate
                            comprehension of critical metrics under high-stress conditions.
                        </p>
                    </div>
                </section>

                {/* Legal Disclaimer */}
                <section className="pt-12 border-t border-slateMid/30">
                    <div className="bg-carbon/50 p-6 border border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Legal Attribution</h3>
                        <p className="text-[10px] text-slate-600 uppercase leading-loose tracking-wider">
                            Formula 1, F1, Grand Prix, and related marks are trademarks of Formula One Licensing B.V.
                            This project is independent and is not affiliated with, sponsored by, or endorsed
                            by the Formula 1 group of companies, the FIA, or any individual Formula 1 team.
                            All data harvested is used for academic investigation and simulation validation purposes.
                        </p>
                    </div>
                </section>

            </div>
        </div>
    );
}
