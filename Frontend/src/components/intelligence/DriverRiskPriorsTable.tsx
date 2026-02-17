import { DriverRiskPrior, DataEnvelope } from '../../types/intelligence';

interface DriverRiskPriorsTableProps {
    envelope: DataEnvelope<DriverRiskPrior[]>;
}

export const DriverRiskPriorsTable: React.FC<DriverRiskPriorsTableProps> = ({ envelope }) => {
    const { data: drivers, validity, reason } = envelope;

    const getIIRColor = (val: number | null) => {
        if (val === null) return 'text-white/20';
        if (val > 0.15) return 'text-[#ff4e4e]';
        if (val > 0.08) return 'text-[#ffb347]';
        return 'text-[#4ade80]';
    };

    const getRestartColor = (val: number | null) => {
        if (val === null) return 'text-white/20';
        if (val > 0.5) return 'text-[#4ade80]';
        if (val < -0.2) return 'text-[#ff4e4e]';
        return 'text-[var(--text-secondary)]';
    };

    return (
        <div className="flex flex-col h-full">
            {validity === 'UNAVAILABLE' ? (
                <div className="flex-1 flex items-center justify-center p-8 text-center bg-black/20">
                    <div>
                        <p className="text-sm text-white/40 font-mono uppercase tracking-widest mb-2 font-bold">Data Unavailable</p>
                        <p className="text-xs text-white/20 max-w-[200px]">{reason || 'Historical priors not yet computed for this profile.'}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-[#1E1E24] shadow-sm">
                            <tr>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5">Driver</th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 text-center">
                                    IIR (NORM)
                                </th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 text-center">
                                    RESTART DELTA
                                </th>
                                <th className="py-3 px-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/5 text-center">
                                    PACE VARIANCE (SIGMA)
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
                                            {driver.name}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center">
                                        <span className={`font-mono font-bold ${getIIRColor(driver.incidentInvolvement)}`}>
                                            {driver.incidentInvolvement !== null ? driver.incidentInvolvement.toFixed(2) : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center text-white/60">
                                        <span className={`font-mono ${getRestartColor(driver.restartDelta)}`}>
                                            {driver.restartDelta !== null ? `${driver.restartDelta > 0 ? '+' : ''}${driver.restartDelta.toFixed(1)}` : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-xs text-center text-white/40">
                                        <span className="font-mono">
                                            {driver.lapTimeVariance !== null ? `${driver.lapTimeVariance.toFixed(2)}s` : '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {validity === 'DEGRADED' && (
                <div className="bg-[#ffb347]/10 p-2 text-center border-t border-[#ffb347]/20">
                    <p className="text-[9px] text-[#ffb347] font-bold uppercase tracking-widest">
                        {reason || 'Estimate shown with limited historical support'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DriverRiskPriorsTable;
