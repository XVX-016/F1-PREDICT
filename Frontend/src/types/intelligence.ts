import { z } from 'zod';

/**
 * Universal Data Envelope
 * Ensures every dataset has context, validity state, and provenance.
 */
export const DataEnvelopeSchema = <T extends z.ZodTypeAny>(schema: T) =>
    z.object({
        context: z.object({
            circuitId: z.string(),
            session: z.enum(["RACE", "SPRINT"]),
            trackCondition: z.enum(["DRY", "INTERMEDIATE", "WET"]),
        }),
        data: schema,
        validity: z.enum(["VALID", "DEGRADED", "UNAVAILABLE"]),
        reason: z.string().optional(),
        source: z.enum(["HISTORICAL", "SIMULATION", "HYBRID"]),
        computedAt: z.string().datetime(),
    });

export type DataEnvelope<T> = {
    context: {
        circuitId: string;
        session: "RACE" | "SPRINT";
        trackCondition: "DRY" | "INTERMEDIATE" | "WET";
    };
    data: T;
    validity: "VALID" | "DEGRADED" | "UNAVAILABLE";
    reason?: string;
    source: "HISTORICAL" | "SIMULATION" | "HYBRID";
    computedAt: string;
};

/**
 * Driver Risk & Variability Prior
 */
export const DriverRiskPriorSchema = z.object({
    driverId: z.string().min(2),
    name: z.string(),
    incidentInvolvement: z.number().min(0).max(1).nullable(),
    restartDelta: z.number().nullable(),
    wetPaceGain: z.number().nullable(),
    lapTimeVariance: z.number().min(0).nullable(),
    sampleSize: z.number().int().min(0).optional(),
});

export type DriverRiskPrior = z.infer<typeof DriverRiskPriorSchema>;

/**
 * Safety Car Hazard Point (PDF)
 */
export const SCHazardPointSchema = z.object({
    lap: z.number().int().positive(),
    historicalRate: z.number().min(0).max(1), // PDF per lap
    inferredRate: z.number().min(0).max(1),   // PDF per lap
    smoothingWindow: z.number().int().positive().optional(),
});

export type SCHazardPoint = z.infer<typeof SCHazardPointSchema>;

export type BaselineOrderItem = {
    driverId: string;
    name: string;
    delta: number | null;
    uncertainty: number | null;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    status: "ESTIMATED" | "NO_DATA";
    sampleSize?: number;
    color: string;
};

/**
 * Supporting Priors
 */
export const SupportingPriorSchema = z.object({
    key: z.string(),
    title: z.string(),
    value: z.number().nullable(),
    unit: z.string(),
    description: z.string(),
    trend: z.enum(["up", "down", "neutral"]).optional(),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type SupportingPrior = z.infer<typeof SupportingPriorSchema>;

/**
 * Podium Probability
 */
export const PodiumProbabilitySchema = z.object({
    driverId: z.string(),
    shortCode: z.string(),
    p1: z.number().min(0).max(1),
    p2: z.number().min(0).max(1),
    p3: z.number().min(0).max(1),
    podium: z.number().min(0).max(1),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type PodiumProbability = z.infer<typeof PodiumProbabilitySchema>;
