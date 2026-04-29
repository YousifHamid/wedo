import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI is missing. Please set your MongoDB Atlas URI in the .env file.");
}

const zones = [
  { name: 'Khartoum North', nameAr: 'الخرطوم شمال', description: 'Industrial Area', descriptionAr: 'المنطقة الصناعية', order: 1 },
  { name: 'Khartoum Center', nameAr: 'وسط الخرطوم', description: 'Downtown & Markets', descriptionAr: 'وسط البلد والأسواق', order: 2 },
  { name: 'Khartoum South', nameAr: 'الخرطوم جنوب', description: 'Residential Areas', descriptionAr: 'المناطق السكنية', order: 3 },
  { name: 'Omdurman', nameAr: 'أم درمان', description: 'Central Market (Souq)', descriptionAr: 'السوق الكبير', order: 4 },
  { name: 'Bahri', nameAr: 'بحري', description: 'Khartoum North District', descriptionAr: 'حي بحري', order: 5 },
  { name: 'Airport', nameAr: 'المطار', description: 'Khartoum Int. Airport', descriptionAr: 'مطار الخرطوم الدولي', order: 6 },
  { name: 'Arkaweet', nameAr: 'أركويت', description: 'Arkaweet District', descriptionAr: 'حي أركويت', order: 7 },
  { name: 'Burri', nameAr: 'بري', description: 'Al-Burri Area', descriptionAr: 'منطقة البري', order: 8 },
  { name: 'Jabra', nameAr: 'جبرة', description: 'Jabra District', descriptionAr: 'حي جبرة', order: 9 },
  { name: 'Riyadh', nameAr: 'الرياض', description: 'Riyadh Quarter', descriptionAr: 'حي الرياض', order: 10 },
];

// Simple pricing generator — creates pricing for common routes
const generatePricing = (zoneIds: string[]) => {
  const basePrices: Record<number, number> = {
    1: 2500, 2: 3000, 3: 3500, 4: 4000, 5: 4500, 6: 5000, 7: 3000, 
  };
  
  const pricingPairs: any[] = [];
  for (let i = 0; i < zoneIds.length; i++) {
    for (let j = 0; j < zoneIds.length; j++) {
      if (i !== j) {
        const distance = Math.abs(i - j);
        const baseFare = basePrices[distance] || 4000;
        pricingPairs.push({
          fromZone: zoneIds[i],
          toZone: zoneIds[j],
          baseFare,
          premiumFare: Math.round(baseFare * 1.6),
          commissionRate: 15,
          isActive: true,
        });
      }
    }
  }
  return pricingPairs;
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await mongoose.connection.db!.collection('zones').deleteMany({});
    await mongoose.connection.db!.collection('pricings').deleteMany({});
    
    // Insert zones
    const result = await mongoose.connection.db!.collection('zones').insertMany(
      zones.map(z => ({ ...z, isActive: true, createdAt: new Date(), updatedAt: new Date() }))
    );
    
    const zoneIds = Object.values(result.insertedIds).map(id => id.toString());
    console.log(`Inserted ${zoneIds.length} zones`);

    // Insert pricing
    const pricing = generatePricing(zoneIds);
    await mongoose.connection.db!.collection('pricings').insertMany(
      pricing.map(p => ({ ...p, fromZone: new mongoose.Types.ObjectId(p.fromZone), toZone: new mongoose.Types.ObjectId(p.toZone), createdAt: new Date(), updatedAt: new Date() }))
    );
    console.log(`Inserted ${pricing.length} pricing entries`);

    // Create admin user
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await mongoose.connection.db!.collection('users').updateOne(
      { phone: '0000000000' },
      { $set: {
        name: 'Admin',
        phone: '0000000000',
        email: 'admin@mashi.sd',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        driverStatus: 'active',
        walletBalance: 0,
        reliabilityScore: 100,
        totalTrips: 0,
        totalEarnings: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }},
      { upsert: true }
    );
    console.log('Admin user created/updated');

    console.log('Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
