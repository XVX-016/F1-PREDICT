import React from 'react';
import { SupportingPrior, DataEnvelope } from '../../types/intelligence';

const PriorCard = ({ prior }: { prior: SupportingPrior }) => (
    <div className="bg-[#1a1a23] rounded-lg border border-white/5 p-4 flex flex-col justify-between group relative h-32 hover:border-white/10 transition-colors">
        <div>
            <div className="flex justify-between items-start mb-1">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{prior.title}</h4>
                <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-2 bg-black border border-white/10 text-[9px] text-white/50 w-44 z-50 pointer-events-none transition-opacity shadow-2xl">
                    <p className="font-bold border-b border-white/5 pb-1 mb-1 uppercase tracking-tighter">Metric Context</p>
                    {prior.description}
                    <div className="mt-2 text-[#4ade80] font-mono tracking-tighter uppercase font-bold text-[8px]">
                        Confidence: {prior.confidence}
                    </div>
                </div>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-mono font-bold ${prior.value === null ? 'text-white/10' : 'text-white'}`}>
                    {prior.value !== null ? prior.value : '—'}
                </span>
                <span className="text-[10px] text-white/20 font-mono uppercase">{prior.unit}</span>
            </div>
        </div>

        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[8px] font-mono text-white/10 uppercase tracking-tighter">
                <span>Simulation Weight</span>
                <span className={prior.confidence === 'HIGH' ? 'text-[#4ade80]' : prior.confidence === 'MEDIUM' ? 'text-[#ffb347]' : 'text-[#ff4e4e]'}>
                    {prior.confidence}
                </span>
            </div>
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${prior.trend === 'up' ? 'bg-[#4ade80]' : prior.trend === 'down' ? 'bg-[#ff4e4e]' : 'bg-white/20'}`}
                    style={{ width: prior.confidence === 'HIGH' ? '100%' : prior.confidence === 'MEDIUM' ? '60%' : '30%' }}
                />
            </div>
        </div>
    </div>
);

/**
 * Supporting Race Priors Section
 * Grid of secondary metrics used for simulation pre-race.
 */
export const SupportingPriorsSection: React.FC<{ envelope: DataEnvelope<SupportingPrior[]> }> = ({ envelope }) => {
    const { data: priors, source, computedAt } = envelope;

    return (
        <section>
            <div className="flex items-end justify-between mb-6">
                <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-bold text-white uppercase tracking-widest border-l-2 border-[#E10600] pl-3">
                        Supporting Race Priors
                    </h2>
                    <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                        Simulation Feed Data
                    </span>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-[9px] text-white/10 font-mono uppercase block tracking-tighter">
                        PROVENANCE: {source} [{new Date(computedAt).toLocaleDateString()}]
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {priors.map(prior => (
                    <PriorCard key={prior.key} prior={prior} />
                ))}
            </div>

            <p className="text-[10px] text-white/10 mt-6 uppercase tracking-[0.2em] font-mono italic text-center border-t border-white/5 pt-4">
                * All metrics derived from FastF1 historical telemetry and GP results archive.
            </p>
        </section>
    );
};

export default SupportingPriorsSection;
