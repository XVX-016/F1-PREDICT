/**
 * Formats a snake_case or SCREAMING_SNAKE_CASE string into Title Case with spaces.
 * Example: 'TYRE_DEG_MULTIPLIER' -> 'Tyre Deg Multiplier'
 */
export const formatLabel = (str: string): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Standardizes units and labels.
 */
export const formatUnit = (value: number, unit: string): string => {
    return `${value}${unit}`;
};
