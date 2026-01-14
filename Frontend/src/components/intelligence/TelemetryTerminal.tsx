import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TelemetryTerminalProps {
    logs: string[];
    metrics: { [key: string]: string | number };
    isConnected: boolean;
}

export const TelemetryTerminal: React.FC<TelemetryTerminalProps> = ({ logs, metrics, isConnected }) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-sm font-mono text-white uppercase tracking-tighter flex items-center gap-2">
                    <TerminalIcon className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-gray-600'}`} />
                    Physics Terminal
                </h3>
                <span className={`text-[10px] font-mono ${isConnected ? 'text-green-500/50 animate-pulse' : 'text-gray-600'}`}>
                    {isConnected ? 'SYSTEM_ACTIVE' : 'SYSTEM_OFFLINE'}
                </span>
            </div>

            <div
                ref={terminalRef}
                className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-1 scrollbar-hide"
            >
                {logs.map((log, i) => (
                    <p key={i} className={`${log.includes('WARNING') ? 'text-red-500' :
                            log.includes('SUCCESS') ? 'text-green-500' :
                                log.includes('>') ? 'text-white' : 'text-gray-500'
                        }`}>
                        {log}
                    </p>
                ))}

                {isConnected && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                        <p className="text-white font-bold tracking-widest uppercase mb-2">Live Metrics</p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(metrics).map(([key, value]) => (
                                <div key={key} className="bg-white/5 p-2 rounded transition-colors hover:bg-white/10">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">{key}</p>
                                    <p className="text-xs text-white font-bold">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
