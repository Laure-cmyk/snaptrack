/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Get score and level based on distance
 * @param {number} distanceInMeters - Distance in meters
 * @returns {Object} Object with level, points, and description
 */
export function getScoreFromDistance(distanceInMeters) {
    if (distanceInMeters <= 20) {
        return { level: 'Parfait', points: 100, description: 'Tu es exactement au bon endroit !' };
    } else if (distanceInMeters <= 50) {
        return { level: 'Excellent', points: 80, description: 'Tu es tout proche du lieu' };
    } else if (distanceInMeters <= 100) {
        return { level: 'Très précis', points: 60, description: 'Tu es très près du lieu' };
    } else if (distanceInMeters <= 500) {
        return { level: 'Proche', points: 40, description: 'Tu es dans les environs' };
    } else if (distanceInMeters <= 1000) {
        return { level: 'Correct', points: 25, description: 'Tu es dans le secteur, mais un peu loin' };
    } else if (distanceInMeters <= 5000) {
        return { level: 'Loin', points: 10, description: 'Tu es encore loin du lieu' };
    } else if (distanceInMeters <= 10000) {
        return { level: 'Très loin', points: 5, description: 'Tu es vraiment trop loin' };
    } else {
        return { level: 'Hors zone', points: 0, description: 'Tu es trop loin du lieu...' };
    }
}

/**
 * Format distance for display
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(distanceInMeters) {
    if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)} m`;
    } else {
        return `${(distanceInMeters / 1000).toFixed(2)} km`;
    }
}
