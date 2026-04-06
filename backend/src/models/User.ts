import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum DriverStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
}

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  phone: string;
  role: UserRole;
  isOnline: boolean;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  walletBalance: number;
  currentZone?: mongoose.Types.ObjectId; // Driver's current zone
  vehicleDetails?: {
    make: string;
    model: string;
    year?: string;
    color?: string;
    plateNumber: string;
  };
  isVerified: boolean;
  driverStatus: DriverStatus;
  reliabilityScore: number;    // 0-100, affects dispatch priority
  totalTrips: number;
  totalEarnings: number;
  isBlocked: boolean; // For blocking riders
  isBusy: boolean;    // For queuing logic
  permissions?: string[]; // For staff (admin/super_admin) to control screen access
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, sparse: true },
  password: { type: String },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.RIDER },
  isOnline: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  walletBalance: { type: Number, default: 0 },
  currentZone: { type: Schema.Types.ObjectId, ref: 'Zone' },
  vehicleDetails: {
    make: { type: String },
    model: { type: String },
    year: { type: String },
    color: { type: String },
    plateNumber: { type: String },
  },
  isVerified: { type: Boolean, default: false },
  driverStatus: { type: String, enum: Object.values(DriverStatus), default: DriverStatus.PENDING },
  reliabilityScore: { type: Number, default: 100, min: 0, max: 100 },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  isBusy: { type: Boolean, default: false },
  permissions: { type: [String], default: [] },
}, { timestamps: true });

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });
// Index for driver matching: zone + online + wallet + reliability
userSchema.index({ role: 1, isOnline: 1, currentZone: 1, walletBalance: 1, reliabilityScore: -1 });

// Password hash middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
