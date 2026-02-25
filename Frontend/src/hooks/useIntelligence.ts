import { useQuery } from '@tanstack/react-query';
import { getIntelligence, getBaselineSummary, getRigorousSimulation } from '../api/localApi';

type SessionType = 'RACE' | 'SPRINT';
type ConditionType = 'DRY' | 'INTERMEDIATE' | 'WET';

const conditionToScProb = (condition: ConditionType): number => {
    if (condition === 'WET') return 0.12;
    if (condition === 'INTERMEDIATE') return 0.08;
    return 0.04;
};

export const useIntelligence = (
    raceId: string,
    driverIds?: string[],
    session: SessionType = 'RACE',
    condition: ConditionType = 'DRY'
) => {
    const driversCsv = driverIds?.join(',');
    const seedBase = `${raceId}:${session}:${condition}`;
    const stableSeed = seedBase.split('').reduce((acc, c) => ((acc * 31) + c.charCodeAt(0)) >>> 0, 17);

    const intelligenceQuery = useQuery({
        queryKey: ['intelligence', raceId, driversCsv, session, condition],
        queryFn: () => getIntelligence(raceId, driversCsv),
        enabled: !!raceId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: undefined,
    });

    const baselineSummaryQuery = useQuery({
        queryKey: ['baseline-summary', raceId, driversCsv, session, condition],
        queryFn: () => getBaselineSummary(raceId, driversCsv!),
        enabled: !!raceId && !!driversCsv,
        staleTime: 1000 * 60 * 5,
        placeholderData: undefined,
    });

    const rigorousQuery = useQuery({
        queryKey: ['rigorous-intelligence', raceId, driversCsv, session, condition],
        queryFn: async () => {
            try {
                return await getRigorousSimulation(raceId, {
                    track_id: raceId,
                    iterations: 120,
                    seed: stableSeed,
                    use_ml: true,
                    params: {
                        focus_driver: 'VER',
                        sc_probability: conditionToScProb(condition),
                        weather_scenario: condition.toLowerCase(),
                        session_type: session.toLowerCase()
                    }
                });
            } catch (err) {
                console.warn('[useIntelligence] Rigorous stream unavailable:', err);
                return null;
            }
        },
        enabled: !!raceId,
        staleTime: 1000 * 60 * 5,
        retry: false,
        placeholderData: undefined,
    });

    const isLoading = intelligenceQuery.isFetching || baselineSummaryQuery.isFetching || rigorousQuery.isFetching;

    return {
        intelligence: intelligenceQuery.data,
        baselineSummary: baselineSummaryQuery.data,
        rigorous: rigorousQuery.data,
        isLoading,
        isError: intelligenceQuery.isError || baselineSummaryQuery.isError,
        error: intelligenceQuery.error || baselineSummaryQuery.error || rigorousQuery.error,
        rigorousUnavailable: !isLoading && rigorousQuery.data == null
    };
};
