// Mock zone data for offline/demo use
// In production, fetched from /api/zones and cached locally
export interface ZoneItem {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}

export const ZONES: ZoneItem[] = [
  { _id: 'z1', name: 'Khartoum North', nameAr: 'الخرطوم شمال', description: 'Industrial Area', descriptionAr: 'المنطقة الصناعية' },
  { _id: 'z2', name: 'Khartoum Center', nameAr: 'وسط الخرطوم', description: 'Downtown & Markets', descriptionAr: 'وسط البلد والأسواق' },
  { _id: 'z3', name: 'Khartoum South', nameAr: 'الخرطوم جنوب', description: 'Residential Areas', descriptionAr: 'المناطق السكنية' },
  { _id: 'z4', name: 'Omdurman', nameAr: 'أم درمان', description: 'Central Market (Souq)', descriptionAr: 'السوق الكبير' },
  { _id: 'z5', name: 'Bahri', nameAr: 'بحري', description: 'Khartoum North District', descriptionAr: 'حي بحري' },
  { _id: 'z6', name: 'Airport', nameAr: 'المطار', description: 'Khartoum Int. Airport', descriptionAr: 'مطار الخرطوم الدولي' },
  { _id: 'z7', name: 'Arkaweet', nameAr: 'أركويت', description: 'Arkaweet District', descriptionAr: 'حي أركويت' },
  { _id: 'z8', name: 'Burri', nameAr: 'بري', description: 'Al-Burri Area', descriptionAr: 'منطقة البري' },
  { _id: 'z9', name: 'Jabra', nameAr: 'جبرة', description: 'Jabra District', descriptionAr: 'حي جبرة' },
  { _id: 'z10', name: 'Riyadh', nameAr: 'الرياض', description: 'Riyadh Quarter', descriptionAr: 'حي الرياض' },
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

// Get fare for zone pair
export const getZoneFare = (fromId: string, toId: string, type: 'standard' | 'premium' = 'standard'): number => {
  const fromPricing = DEFAULT_PRICING[fromId];
  if (!fromPricing) return 4000; // fallback
  const pair = fromPricing[toId];
  if (!pair) return 4000;
  return pair[type];
};
