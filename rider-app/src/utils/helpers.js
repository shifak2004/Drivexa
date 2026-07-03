/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param {number} lat1 Latitude of first point
 * @param {number} lon1 Longitude of first point
 * @param {number} lat2 Latitude of second point
 * @param {number} lon2 Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Estimates the ride fare based on distance
 * @param {number} distance Distance in kilometers
 * @returns {number} Estimated fare in Rupees
 */
export const calculateFare = (distance) => {
  const BASE_FARE = 50;
  const PER_KM_RATE = 10;
  return Math.round(BASE_FARE + distance * PER_KM_RATE);
};

/**
 * Formats a Date object or ISO string into a readable date and time string
 * @param {Date|string} dateObj Date representation
 * @returns {string} Formatted string
 */
export const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const date = new Date(dateObj);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
