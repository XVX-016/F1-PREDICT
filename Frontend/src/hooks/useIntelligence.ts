import { useQuery } from '@tanstack/react-query';
import { getIntelligence, getBaseline, getBaselineSummary } from '../api/localApi';

export const useIntelligence = (raceId: string, driverIds?: string[]) => {
    const driversCsv = driverIds?.join(',');

    const intelligenceQuery = useQuery({
        queryKey: ['intelligence', raceId, driversCsv],
        queryFn: () => getIntelligence(raceId, driversCsv),
        enabled: !!raceId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const baselineQuery = useQuery({
        queryKey: ['baseline', raceId],
        queryFn: () => getBaseline(raceId),
        enabled: !!raceId,
        staleTime: 1000 * 60 * 5,
    });

    const baselineSummaryQuery = useQuery({
        queryKey: ['baseline-summary', raceId, driversCsv],
        queryFn: () => getBaselineSummary(raceId, driversCsv!),
        enabled: !!raceId && !!driversCsv,
        staleTime: 1000 * 60 * 5,
    });

    return {
        intelligence: intelligenceQuery.data,
        baseline: baselineQuery.data,
        baselineSummary: baselineSummaryQuery.data,
        isLoading: intelligenceQuery.isLoading || baselineQuery.isLoading || baselineSummaryQuery.isLoading,
        isError: intelligenceQuery.isError || baselineQuery.isError || baselineSummaryQuery.isError,
        error: intelligenceQuery.error || baselineQuery.error || baselineSummaryQuery.error,
    };
};
