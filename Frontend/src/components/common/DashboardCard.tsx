import React from 'react';

interface DashboardCardProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    loading?: boolean;
    noData?: boolean;
    noDataMessage?: string;
    stale?: boolean;
    staleMessage?: string;
    headerAction?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    subtitle,
    children,
    className = '',
    loading = false,
    noData = false,
    noDataMessage = 'No telemetry available',
    stale = false,
    staleMessage = 'DATA STALE',
    headerAction,
}) => {
    return (
        <div className={`bg-[#121217] border border-[#1f1f26] rounded-md flex flex-col overflow-hidden ${className}`}>
            {(title || subtitle || headerAction) && (
                <div className="px-4 py-3 border-b border-[#1f1f26] flex justify-between items-start">
                    <div>
                        {title && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{title}</h3>}
                        {subtitle && <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {stale && (
                            <span className="text-[9px] font-bold text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.5 border border-[#FFB800]/20 rounded-xs animate-pulse">
                                {staleMessage}
                            </span>
                        )}
                        {headerAction}
                    </div>
                </div>
            )}

            <div className="flex-1 p-4 relative">
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                        <div className="h-24 bg-gray-800 rounded w-full"></div>
                        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    </div>
                ) : noData ? (
                    <div className="h-full flex items-center justify-center py-12">
                        <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">{noDataMessage}</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default DashboardCard;
