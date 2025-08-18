// server/src/models/Invite.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
  email: string;
  tokenHash: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    email: { type: String, required: true, index: true, unique: true },
    tokenHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);