import { ENV_CONFIG } from '../config/environment';

/**
 * Utility to get the correct URL for a public asset.
 * If the path is absolute (starts with http), it's returned as-is.
 * If the path starts with '/', it's treated as a public asset and
 * prefixed with the Supabase Storage CDN URL.
 */
export const getAssetUrl = (path?: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Normalize path (ensure it starts with / for consistency with local paths)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Return Supabase URL
    return `${ENV_CONFIG.SUPABASE_ASSETS_BASE}${normalizedPath}`;
};

export const resolveAssetUrl = getAssetUrl;

/**
 * Helper for circuit images which have a specific naming convention in some places
 */
export const getCircuitImageUrl = (filename: string): string => {
    return getAssetUrl(`/circuits/${filename}`);
};
