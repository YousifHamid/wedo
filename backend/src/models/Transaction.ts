import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  description: string;
  trip?: mongoose.Types.ObjectId;
  balanceAfter: number; // Important for audit
}

const transactionSchema = new Schema<ITransaction>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  description: { type: String, required: true },
  trip: { type: Schema.Types.ObjectId, ref: 'Trip' },
  balanceAfter: { type: Number, required: true },
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
