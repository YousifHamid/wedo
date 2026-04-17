// Mock zone data for offline/demo use
// In production, fetched from /api/zones and cached locally
export interface ZoneItem {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  lat: number;
  lng: number;
}

export const ZONES: ZoneItem[] = [
  { _id: 'z1', name: 'Khartoum North', nameAr: 'الخرطوم شمال', description: 'Industrial Area', descriptionAr: 'المنطقة صناعية', lat: 15.6333, lng: 32.5333 },
  { _id: 'z2', name: 'Khartoum Center', nameAr: 'وسط الخرطوم', description: 'Downtown & Markets', descriptionAr: 'وسط البلد والأسواق', lat: 15.5881, lng: 32.5342 },
  { _id: 'z3', name: 'Khartoum South', nameAr: 'الخرطوم جنوب', description: 'Residential Areas', descriptionAr: 'المناطق السكنية', lat: 15.5333, lng: 32.5500 },
  { _id: 'z4', name: 'Omdurman', nameAr: 'أم درمان', description: 'Central Market (Souq)', descriptionAr: 'السوق الكبير', lat: 15.6500, lng: 32.4833 },
  { _id: 'z5', name: 'Bahri', nameAr: 'بحري', description: 'Khartoum North District', descriptionAr: 'حي بحري', lat: 15.6167, lng: 32.5333 },
  { _id: 'z6', name: 'Airport', nameAr: 'المطار', description: 'Khartoum Int. Airport', descriptionAr: 'مطار الخرطوم الدولي', lat: 15.5895, lng: 32.5531 },
  { _id: 'z7', name: 'Arkaweet', nameAr: 'أركويت', description: 'Arkaweet District', descriptionAr: 'حي أركويت', lat: 15.5656, lng: 32.5694 },
  { _id: 'z8', name: 'Burri', nameAr: 'بري', description: 'Al-Burri Area', descriptionAr: 'منطقة البري', lat: 15.5972, lng: 32.5639 },
  { _id: 'z9', name: 'Jabra', nameAr: 'جبرة', description: 'Jabra District', descriptionAr: 'حي جبرة', lat: 15.5200, lng: 32.5300 },
  { _id: 'z10', name: 'Riyadh', nameAr: 'الرياض', description: 'Riyadh Quarter', descriptionAr: 'حي الرياض', lat: 15.5700, lng: 32.5600 },
];

// Default pricing matrix (SDG) — fetched from API in production
export const DEFAULT_PRICING: Record<string, Record<string, { standard: number; premium: number }>> = {
  z1: { z2: { standard: 3500, premium: 5500 }, z3: { standard: 4000, premium: 6500 }, z4: { standard: 4500, premium: 7000 }, z5: { standard: 2500, premium: 4000 }, z6: { standard: 5000, premium: 8000 } },
  z2: { z1: { standard: 3500, premium: 5500 }, z3: { standard: 3000, premium: 5000 }, z4: { standard: 4000, premium: 6000 }, z5: { standard: 3500, premium: 5500 }, z6: { standard: 4500, premium: 7500 } },
  z3: { z1: { standard: 4000, premium: 6500 }, z2: { standard: 3000, premium: 5000 }, z4: { standard: 4500, premium: 7000 }, z5: { standard: 4000, premium: 6500 }, z6: { standard: 3500, premium: 6000 } },
  z4: { z1: { standard: 4500, premium: 7000 }, z2: { standard: 4000, premium: 6000 }, z3: { standard: 4500, premium: 7000 }, z5: { standard: 5000, premium: 7500 }, z6: { standard: 6000, premium: 9000 } },
  z5: { z1: { standard: 2500, premium: 4000 }, z2: { standard: 3500, premium: 5500 }, z3: { standard: 4000, premium: 6500 }, z4: { standard: 5000, premium: 7500 }, z6: { standard: 4500, premium: 7000 } },
  z6: { z1: { standard: 5000, premium: 8000 }, z2: { standard: 4500, premium: 7500 }, z3: { standard: 3500, premium: 6000 }, z4: { standard: 6000, premium: 9000 }, z5: { standard: 4500, premium: 7000 } },
};

import { PRICING_CONFIG } from './pricing';

// Haversine formula to calculate distance between two coordinates in KM
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get fare for zone pair with dynamic surges (Sudan competitive rates)
export const getZoneFare = (fromId: string, toId: string, type: 'standard' | 'premium' = 'standard', surges: { traffic?: boolean, rush?: boolean, fuel?: boolean } = {}): number => {
  const fromZone = ZONES.find(z => z._id === fromId);
  const toZone = ZONES.find(z => z._id === toId);
  
  const fromPricing = DEFAULT_PRICING[fromId];
  let baseFare = 0;

  if (fromPricing && fromPricing[toId]) {
    baseFare = fromPricing[toId][type];
  } else if (fromZone && toZone) {
    // If not in matrix, calculate by distance with a base pickup fee
    const distanceKm = calculateDistance(fromZone.lat, fromZone.lng, toZone.lat, toZone.lng);
    const config = type === 'standard' ? PRICING_CONFIG.STANDARD : PRICING_CONFIG.PREMIUM;
    
    // Base pickup fee in Sudan is ~1500-2500 SDG
    const basePickup = type === 'standard' ? 2000 : 3500;
    baseFare = basePickup + (distanceKm * config.base);
  } else {
    baseFare = type === 'standard' ? 3500 : 6000;
  }

  // Apply Dynamic Surges
  let multiplier = 1;
  if (surges.traffic) multiplier += PRICING_CONFIG.SURGES.TRAFFIC;
  if (surges.rush) multiplier += PRICING_CONFIG.SURGES.RUSH_HOUR;
  if (surges.fuel) multiplier += PRICING_CONFIG.SURGES.FUEL_SHORTAGE;

  let totalFare = baseFare * multiplier;

  // Wedo Competitiveness: Always 10% cheaper than market averages in Sudan
  totalFare = totalFare * 0.90;

  // Minimum fare safety
  const minFare = type === 'standard' ? 1500 : 3000;
  totalFare = Math.max(totalFare, minFare);

  // Round to nearest 50 for realistic SDG pricing cash flow
  return Math.round(totalFare / 50) * 50;
};
