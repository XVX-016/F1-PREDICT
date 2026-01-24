/**
 * Deterministic Random Number Generator
 * 
 * Uses the Mulberry32 algorithm for reproducible random sequences.
 * Given the same seed, produces identical outputs across runs.
 */

export function mulberry32(seed: number): () => number {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Creates a random number generator with utility methods
 */
export function createRng(seed: number) {
    const random = mulberry32(seed);

    return {
        /** Returns a random number between 0 and 1 */
        next: random,

        /** Returns a random number between min and max */
        range: (min: number, max: number): number => {
            return min + random() * (max - min);
        },

        /** Returns true with the given probability (0-1) */
        chance: (probability: number): boolean => {
            return random() < probability;
        },

        /** Picks a random element from an array */
        pick: <T>(array: T[]): T => {
            return array[Math.floor(random() * array.length)];
        }
    };
}
