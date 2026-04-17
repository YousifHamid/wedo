import mongoose, { Document, Schema } from 'mongoose';

export enum TripStatus {
  PENDING = 'pending',
  DISPATCHING = 'dispatching',  // Sequential dispatch in progress
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VehicleType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export interface ITrip extends Document {
  rider: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  pickupZone: mongoose.Types.ObjectId;
  dropoffZone: mongoose.Types.ObjectId;
  pickupAddress?: string;
  dropoffAddress?: string;
  // Keep legacy geo fields for optional future use
  pickupLocation?: {
    type: string;
    coordinates: number[];
  };
  dropoffLocation?: {
    type: string;
    coordinates: number[];
  };
  vehicleType: VehicleType;
  status: TripStatus;
  fareEstimate: number;        // In SDG
  finalFare?: number;
  commission?: number;         // Commission amount deducted
  commissionRate?: number;     // Rate at time of trip
  paymentMethod: string;       // Always 'cash'
  distanceMeter?: number;
  durationSeconds?: number;
  // Sequential dispatch tracking
  dispatchAttempts: {
    driver: mongoose.Types.ObjectId;
    sentAt: Date;
    respondedAt?: Date;
    response?: 'accepted' | 'rejected' | 'timeout';
  }[];
  currentDispatchDriver?: mongoose.Types.ObjectId;
  rating?: number;
  ratingComment?: string;
  // Phone number masking (like Uber) — temporary proxy numbers per trip
  proxyPhoneRider?: string;   // Rider calls this → forwards to driver
  proxyPhoneDriver?: string;  // Driver calls this → forwards to rider
}

const tripSchema = new Schema<ITrip>({
  rider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: Schema.Types.ObjectId, ref: 'User' },
  pickupZone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  dropoffZone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  pickupAddress: { type: String },
  dropoffAddress: { type: String },
  pickupLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  dropoffLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  vehicleType: { type: String, enum: Object.values(VehicleType), default: VehicleType.STANDARD },
  status: { type: String, enum: Object.values(TripStatus), default: TripStatus.PENDING },
  fareEstimate: { type: Number, required: true },
  finalFare: { type: Number },
  commission: { type: Number },
  commissionRate: { type: Number },
  paymentMethod: { type: String, default: 'cash' },
  distanceMeter: { type: Number },
  durationSeconds: { type: Number },
  dispatchAttempts: [{
    driver: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
    respondedAt: { type: Date },
    response: { type: String, enum: ['accepted', 'rejected', 'timeout'] },
  }],
  currentDispatchDriver: { type: Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  ratingComment: { type: String },
  proxyPhoneRider: { type: String },
  proxyPhoneDriver: { type: String },
}, { timestamps: true });

tripSchema.index({ pickupZone: 1, status: 1 });
tripSchema.index({ driver: 1, status: 1 });
tripSchema.index({ rider: 1, status: 1 });
tripSchema.index({ status: 1, createdAt: -1 });

const Trip = mongoose.model<ITrip>('Trip', tripSchema);
export default Trip;
