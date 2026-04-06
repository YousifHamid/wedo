import mongoose, { Document, Schema } from 'mongoose';

export enum ComplaintStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export interface IComplaint extends Document {
  tripId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId; 
  reportedId?: mongoose.Types.ObjectId; 
  reason: string;
  details?: string;
  status: ComplaintStatus;
}

const complaintSchema = new Schema<IComplaint>({
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportedId: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: Object.values(ComplaintStatus), default: ComplaintStatus.PENDING },
}, { timestamps: true });

const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
export default Complaint;
