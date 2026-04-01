import mongoose, { Document, Schema } from 'mongoose';

export enum TopUpStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IWalletTopUp extends Document {
  driver: mongoose.Types.ObjectId;
  amount: number;
  reference: string;           // Cash deposit reference number
  status: TopUpStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  notes?: string;
}

const walletTopUpSchema = new Schema<IWalletTopUp>({
  driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  reference: { type: String, required: true },
  status: { type: String, enum: Object.values(TopUpStatus), default: TopUpStatus.PENDING },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  notes: { type: String },
}, { timestamps: true });

walletTopUpSchema.index({ driver: 1, status: 1 });
walletTopUpSchema.index({ status: 1, createdAt: -1 });

const WalletTopUp = mongoose.model<IWalletTopUp>('WalletTopUp', walletTopUpSchema);
export default WalletTopUp;
