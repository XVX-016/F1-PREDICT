const REPO_URL = 'https://github.com/XVX-016/F1-PREDICT';
const ARCHITECTURE_DOC = `${REPO_URL}/blob/main/docs/architecture.md`;
const API_DOC = `${REPO_URL}/blob/main/docs/api.md`;
const GOLD_DATASET_DOC = `${REPO_URL}/blob/main/docs/gold_dataset_spec.md`;
const RIGOROUS_GOVERNANCE_DOC = `${REPO_URL}/blob/main/docs/rigorous_governance.md`;

function FooterLink({
    href,
    children,
}: {
    href: string;
    children: string;
}) {
    return (
        <a
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
            className="hover:text-white transition-colors"
        >
            {children}
        </a>
    );
}

export default function Footer() {
    return (
        <footer className="w-full bg-[#0B0E11] border-t border-white/5 py-12 px-6 mt-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4">
                    <h3 className="text-white font-semibold tracking-wide uppercase text-sm">F1-PREDICT</h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                        Simulation-first Formula 1 strategy platform with deterministic replay,
                        rigorous calibration workflows, and inference-first intelligence analysis.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-3">
                        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Project</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li><FooterLink href="#/about">About</FooterLink></li>
                            <li><FooterLink href={REPO_URL}>GitHub Repository</FooterLink></li>
                            <li><FooterLink href={ARCHITECTURE_DOC}>Architecture</FooterLink></li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Documentation</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li><FooterLink href={API_DOC}>API Overview</FooterLink></li>
                            <li><FooterLink href={GOLD_DATASET_DOC}>Gold Dataset Spec</FooterLink></li>
                            <li><FooterLink href={RIGOROUS_GOVERNANCE_DOC}>Rigorous Governance</FooterLink></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">
                    (C) Personal engineering project. Not affiliated with Formula 1, FIA, or any team.
                </p>
                <p className="text-slate-600 text-[10px] font-mono whitespace-nowrap">
                    BUILD: 2026.02.SIM-FIRST
                </p>
            </div>
        </footer>
    );
}

