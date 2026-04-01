import mongoose, { Document, Schema } from 'mongoose';

export interface IPricing extends Document {
  fromZone: mongoose.Types.ObjectId;
  toZone: mongoose.Types.ObjectId;
  baseFare: number;         // Fixed zone-to-zone fare in SDG
  premiumFare: number;      // Premium vehicle fare in SDG
  commissionRate: number;   // Percentage (e.g., 15 = 15%)
  isActive: boolean;
}

const pricingSchema = new Schema<IPricing>({
  fromZone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  toZone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  baseFare: { type: Number, required: true },
  premiumFare: { type: Number, required: true },
  commissionRate: { type: Number, default: 15 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Unique pricing per zone pair
pricingSchema.index({ fromZone: 1, toZone: 1 }, { unique: true });

const Pricing = mongoose.model<IPricing>('Pricing', pricingSchema);
export default Pricing;
