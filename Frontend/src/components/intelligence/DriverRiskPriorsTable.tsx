import React from 'react';
import { DriverRiskPrior, DataEnvelope } from '../../types/intelligence';

interface DriverRiskPriorsTableProps {
    envelope: DataEnvelope<DriverRiskPrior[]>;
}

/**
 * Driver Risk & Variability Priors Table
 * Full grid representation with internal scrolling and strict provenance metadata.
 */
export const DriverRiskPriorsTable: React.FC<DriverRiskPriorsTableProps> = ({ envelope }) => {
    const { data: drivers, source, computedAt, validity, reason } = envelope;

    const getIIRColor = (val: number | null) => {
        if (val === null) return 'text-white/20';
        if (val > 0.15) return 'text-[#ff4e4e]'; // High risk
        if (val > 0.08) return 'text-[#ffb347]'; // Medium risk
        return 'text-[#4ade80]';                // Low risk
    };

    const getRestartColor = (val: number | null) => {
        if (val === null) return 'text-white/20';
        if (val > 0.5) return 'text-[#4ade80]';  // Strong
        if (val < -0.2) return 'text-[#ff4e4e]'; // Weak
        return 'text-[var(--text-secondary)]';
    };

    return (
        <div className="bg-[#15151e] rounded-xl border border-white/10 overflow-hidden flex flex-col h-[600px]">
            {/* Header with Provenance */}
            <div className="p-4 border-b border-white/10 bg-[#1E1E24] flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Driver Risk & Variability Priors</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        Historical behavior inferred from past races.
                    </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${validity === 'VALID' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-[#ffb347]/10 text-[#ffb347]'}`}>
                            {validity}
                        </span>
                        <span className="text-[9px] text-white/20 font-mono uppercase tracking-tighter">
                            Source: {source}
                        </span>
                    </div>
                    <div className="text-[8px] text-white/10 font-mono">
                        UPDATED: {new Date(computedAt).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {validity === 'UNAVAILABLE' ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center bg-black/20">
                    <div>
                        <p className="text-sm text-white/40 font-mono uppercase tracking-widest mb-2 font-bold">Data Unavailable</p>
                        <p className="text-xs text-white/20 max-w-[200px]">{reason || "Historical priors not yet computed for this profile."}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#1E1E24] shadow-sm">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5">Driver</th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 group relative cursor-help text-center">
                                    IIR
                                    <div className="invisible group-hover:visible absolute top-full left-1/2 -translate-x-1/2 w-48 p-2 bg-black border border-white/10 text-[9px] normal-case tracking-normal z-50 shadow-2xl pointer-events-none">
                                        <p className="font-bold mb-1 uppercase text-white/60">Incident Involvement Rate</p>
                                        Normalized likelihood of involvement in collisions or off-track events.
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 group relative cursor-help text-center">
                                    RESTART Δ
                                    <div className="invisible group-hover:visible absolute top-full left-1/2 -translate-x-1/2 w-48 p-2 bg-black border border-white/10 text-[9px] normal-case tracking-normal z-50 shadow-2xl pointer-events-none">
                                        <p className="font-bold mb-1 uppercase text-white/60">Restart Delta</p>
                                        Average positions gained (+) or lost (-) during SC restarts.
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 group relative cursor-help text-center">
                                    WET WINS
                                    <div className="invisible group-hover:visible absolute top-full left-1/2 -translate-x-1/2 w-48 p-2 bg-black border border-white/10 text-[9px] normal-case tracking-normal z-50 shadow-2xl pointer-events-none">
                                        <p className="font-bold mb-1 uppercase text-white/60">Wet Pace Bias</p>
                                        Relative pace gain/loss in wet vs dry conditions.
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 group relative cursor-help text-center">
                                    σ VARIANCE
                                    <div className="invisible group-hover:visible absolute top-full left-1/2 -translate-x-1/2 w-48 p-2 bg-black border border-white/10 text-[9px] normal-case tracking-normal z-50 shadow-2xl pointer-events-none">
                                        <p className="font-bold mb-1 uppercase text-white/60">Pace σ</p>
                                        Standard deviation of lap times (consistency). Higher = more volatile.
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver.driverId} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                                    <td className="py-3 px-4 text-xs font-bold text-white uppercase flex items-center gap-2">
                                        <span className="w-1 h-3 bg-white/5 group-hover/row:bg-[#E10600] transition-colors"></span>
                                        {driver.driverId}
                                        <span className="text-[10px] text-white/20 font-normal ml-1">
                                            {driver.name.split(' ').pop()}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center">
                                        <span className={`font-mono font-bold ${getIIRColor(driver.incidentInvolvement)}`}>
                                            {driver.incidentInvolvement !== null ? driver.incidentInvolvement.toFixed(2) : '—'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center text-white/60">
                                        <span className={`font-mono ${getRestartColor(driver.restartDelta)}`}>
                                            {driver.restartDelta !== null ? `${driver.restartDelta > 0 ? '+' : ''}${driver.restartDelta.toFixed(1)}` : '—'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center text-white/60">
                                        <span className="font-mono">
                                            {driver.wetPaceGain !== null ? `${driver.wetPaceGain > 0 ? '+' : ''}${(driver.wetPaceGain * 100).toFixed(1)}%` : '—'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center text-white/40">
                                        <span className="font-mono">
                                            {driver.lapTimeVariance !== null ? `${driver.lapTimeVariance.toFixed(2)}s` : '—'}
                                        </span>
                                        {driver.sampleSize && (
                                            <div className="text-[8px] opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                N={driver.sampleSize}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {validity === 'DEGRADED' && (
                <div className="bg-[#ffb347]/10 p-2 text-center border-t border-[#ffb347]/20">
                    <p className="text-[9px] text-[#ffb347] font-bold uppercase tracking-widest">{reason || "Estimate shown with limited historical support"}</p>
                </div>
            )}
        </div>
    );
};

export default DriverRiskPriorsTable;
