import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IRefreshToken {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'user' | 'admin';
  refreshTokens: IRefreshToken[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
  addRefreshToken(tokenHash: string, expiresAt: Date, meta?: Partial<IRefreshToken>): void;
  removeRefreshToken(tokenHash: string): void;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  userAgent: String,
  ip: String
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshTokens: { type: [RefreshTokenSchema], default: [] },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// hash password before save
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.addRefreshToken = function (tokenHash: string, expiresAt: Date, meta?: Partial<IRefreshToken>) {
  this.refreshTokens.push({ tokenHash, createdAt: new Date(), expiresAt, ...meta });
};

UserSchema.methods.removeRefreshToken = function (tokenHash: string) {
  this.refreshTokens = this.refreshTokens.filter((rt: IRefreshToken) => rt.tokenHash !== tokenHash);
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);