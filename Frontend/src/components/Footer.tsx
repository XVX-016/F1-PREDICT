

export default function Footer() {
    return (
        <footer className="w-full bg-[#0B0E11] border-t border-white/5 py-12 px-6 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4">
                    <h3 className="text-white font-semibold tracking-wide uppercase text-sm">F1 Race Intelligence</h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                        Physics-based strategy simulation for Formula 1. Investigating deterministic models and Monte Carlo uncertainty propagation in race operations.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                    <div className="space-y-3">
                        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Project</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li className="hover:text-white cursor-pointer transition-colors" onClick={() => (window.location.hash = '#/about')}>About Project</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Architecture</li>
                            <li className="hover:text-white cursor-pointer transition-colors">GitHub</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Resources</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li className="hover:text-white cursor-pointer transition-colors">Data Sources</li>
                            <li className="hover:text-white cursor-pointer transition-colors">API Documentation</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">
                    © Personal engineering project — NOT AFFILIATED WITH FORMULA 1, THE FIA, OR ANY TEAM.
                </p>
                <p className="text-slate-600 text-[10px] font-mono whitespace-nowrap">
                    BUILD: 2026.01.PWP-ALPHA
                </p>
            </div>
        </footer>
    );
}
