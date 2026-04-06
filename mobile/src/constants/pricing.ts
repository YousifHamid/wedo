/**
 * Wedo Sudan Pricing Constants & Logic
 */

export const PRICING_CONFIG = {
  // Base rates per kilometer (SDG)
  STANDARD: {
    min: 600,
    max: 900,
    base: 750, // default mid-point
  },
  PREMIUM: {
    min: 1000,
    max: 1400,
    base: 1200, // default mid-point
  },

  // Surge Multipliers
  SURGES: {
    TRAFFIC: 0.20,      // +20%
    RUSH_HOUR: 0.15,    // +15%
    FUEL_SHORTAGE: 0.25, // +25% (avg of 20-30%)
  },

  // Waiting Charges
  WAITING: {
    FREE_MINUTES: 5,
    RATE_PER_10_MIN: {
      min: 1500,
      max: 2500,
      base: 2000,
    }
  }
};

/**
 * Simple fare calculator for Sudanese market
 */
export const calculateFare = (distanceKm: number, options: { 
  isPremium?: boolean, 
  hasTraffic?: boolean, 
  isRushHour?: boolean, 
  hasFuelShortage?: boolean,
  waitingMinutes?: number 
} = {}) => {
  const config = options.isPremium ? PRICING_CONFIG.PREMIUM : PRICING_CONFIG.STANDARD;
  
  // Base distance fare
  let fare = distanceKm * config.base;
  
  // Apply surges
  let surgeMultiplier = 0;
  if (options.hasTraffic) surgeMultiplier += PRICING_CONFIG.SURGES.TRAFFIC;
  if (options.isRushHour) surgeMultiplier += PRICING_CONFIG.SURGES.RUSH_HOUR;
  if (options.hasFuelShortage) surgeMultiplier += PRICING_CONFIG.SURGES.FUEL_SHORTAGE;
  
  fare += (fare * surgeMultiplier);
  
  // Apply waiting charges
  if (options.waitingMinutes && options.waitingMinutes > PRICING_CONFIG.WAITING.FREE_MINUTES) {
    const chargeableMinutes = options.waitingMinutes - PRICING_CONFIG.WAITING.FREE_MINUTES;
    const waitingBlocks = Math.ceil(chargeableMinutes / 10);
    fare += (waitingBlocks * PRICING_CONFIG.WAITING.RATE_PER_10_MIN.base);
  }
  
  // Minimum trip fare (e.g. 2000 SDG)
  return Math.max(Math.round(fare), 2000);
};
