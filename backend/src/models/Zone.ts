import mongoose, { Document, Schema } from 'mongoose';

export interface IZone extends Document {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  isActive: boolean;
  order: number;
}

const zoneSchema = new Schema<IZone>({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String, required: true },
  description: { type: String },
  descriptionAr: { type: String },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const Zone = mongoose.model<IZone>('Zone', zoneSchema);
export default Zone;
