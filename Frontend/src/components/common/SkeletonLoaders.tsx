

const BaseSkeleton = ({ className }: { className?: string }) => (
    <div className={`animate-shimmer bg-white/5 rounded-xl ${className}`} />
);

export const NextRaceHeroSkeleton = () => (
    <div className="w-full h-[400px] bg-black/20 border border-white/20 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1 space-y-4">
                <BaseSkeleton className="h-4 w-24" />
                <BaseSkeleton className="h-12 sm:h-16 md:h-20 w-3/4" />
                <div className="space-y-3">
                    <BaseSkeleton className="h-6 w-1/2" />
                    <BaseSkeleton className="h-6 w-1/3" />
                </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
                <BaseSkeleton className="h-10 w-32 rounded-full" />
                <div className="flex gap-3">
                    <BaseSkeleton className="h-[56px] w-[160px]" />
                    <BaseSkeleton className="h-[56px] w-[140px]" />
                </div>
            </div>
        </div>
    </div>
);

export const RaceCardSkeleton = () => (
    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <BaseSkeleton className="h-32 w-full rounded-none" />
        <div className="p-6 space-y-4">
            <BaseSkeleton className="h-8 w-3/4" />
            <BaseSkeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center py-2">
                <BaseSkeleton className="h-4 w-24" />
                <BaseSkeleton className="h-6 w-16 rounded-full" />
            </div>
            <BaseSkeleton className="h-12 w-full" />
        </div>
    </div>
);

export const MarketCardSkeleton = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <BaseSkeleton className="h-6 w-32" />
                <BaseSkeleton className="h-4 w-24" />
            </div>
            <BaseSkeleton className="h-8 w-8 rounded-lg" />
        </div>
        <div className="space-y-3 mt-6">
            <BaseSkeleton className="h-12 w-full" />
            <BaseSkeleton className="h-12 w-full" />
            <BaseSkeleton className="h-12 w-full" />
        </div>
    </div>
);
