import React from 'react';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface DriftMetrics {
    pace_mae: number;
    calibration_error: number;
    rank_correlation: number;
    status: 'Healthy' | 'Warning' | 'Critical';
}

interface ModelDriftPanelProps {
    metrics: DriftMetrics | null;
}

const ModelDriftPanel: React.FC<ModelDriftPanelProps> = ({ metrics }) => {
    if (!metrics) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Healthy': return 'text-green-400';
            case 'Warning': return 'text-yellow-400';
            case 'Critical': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    return (
<<<<<<< HEAD
        <div className="bg-slate-900/30 border border-white/5 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" />
                    Model Drift Diagnostics
                </h3>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${getStatusColor(metrics.status)}`}>
                    {metrics.status === 'Healthy' ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
                    {metrics.status}
=======
        <div className="bg-[#121217] border border-[#1f1f26] rounded-md p-6 mt-8">
            <div className="flex justify-between items-center mb-6 border-b border-[#1f1f26] pb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" />
                    MODEL_DRIFT_DIAGNOSTICS_V2
                </h3>
                <div className={`flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest ${getStatusColor(metrics.status)}`}>
                    {metrics.status === 'Healthy' ? <TrendingUp size={12} /> : <AlertTriangle size={12} />}
                    {metrics.status.toUpperCase()}
>>>>>>> feature/redis-telemetry-replay
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<<<<<<< HEAD
                <div className="p-4 bg-black/20 rounded border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Pace MAE</p>
                    <p className="text-lg font-mono text-white font-bold">{metrics.pace_mae.toFixed(1)}ms</p>
                    <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (metrics.pace_mae / 200) * 100)}%` }}></div>
                    </div>
                </div>

                <div className="p-4 bg-black/20 rounded border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Calibration Error</p>
                    <p className="text-lg font-mono text-white font-bold">{metrics.calibration_error.toFixed(3)}</p>
                    <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, metrics.calibration_error * 100)}%` }}></div>
                    </div>
                </div>

                <div className="p-4 bg-black/20 rounded border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase mb-1">Rank Correlation</p>
                    <p className="text-lg font-mono text-white font-bold">{metrics.rank_correlation.toFixed(2)}</p>
                    <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${metrics.rank_correlation * 100}%` }}></div>
=======
                <div className="p-4 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">PACE_MAE</p>
                    <p className="text-lg font-mono text-white font-black leading-none">{metrics.pace_mae.toFixed(1)}ms</p>
                    <div className="w-full bg-black h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${Math.min(100, (metrics.pace_mae / 200) * 100)}%` }}></div>
                    </div>
                </div>

                <div className="p-4 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">CALIBRATION_ERROR</p>
                    <p className="text-lg font-mono text-white font-black leading-none">{metrics.calibration_error.toFixed(3)}</p>
                    <div className="w-full bg-black h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full" style={{ width: `${Math.min(100, metrics.calibration_error * 100)}%` }}></div>
                    </div>
                </div>

                <div className="p-4 bg-[#1f1f26] rounded border border-[#2a2a35]">
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">RANK_CORRELATION</p>
                    <p className="text-lg font-mono text-white font-black leading-none">{metrics.rank_correlation.toFixed(2)}</p>
                    <div className="w-full bg-black h-1 mt-3 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full" style={{ width: `${metrics.rank_correlation * 100}%` }}></div>
>>>>>>> feature/redis-telemetry-replay
                    </div>
                </div>
            </div>

<<<<<<< HEAD
            <div className="mt-6 text-[10px] text-slate-600 font-mono">
                Last Sync: {new Date().toLocaleDateString()} | Threshold: MAE &lt; 150ms
=======
            <div className="mt-6 text-[9px] text-gray-600 font-mono uppercase tracking-widest flex justify-between">
                <span>Last Sync: {new Date().toLocaleDateString()}</span>
                <span>Threshold: MAE &lt; 150ms | MODEL_LOCK: ON</span>
>>>>>>> feature/redis-telemetry-replay
            </div>
        </div>
    );
};

export default ModelDriftPanel;
