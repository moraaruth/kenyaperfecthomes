import mongoose, { Schema, InferSchemaType, Model } from 'mongoose';

export const USER_ROLES = ['admin', 'agent', 'user'] as const;
export const USER_STATUSES = ['active', 'suspended', 'disabled'] as const;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    status: { type: String, enum: USER_STATUSES, default: 'active' },
    // Bumped on logout, password change, or role/status change to invalidate existing sessions
    tokenVersion: { type: Number, default: 0 },
    lastLogin: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    resetRequestedAt: { type: Date },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) || mongoose.model<UserDocument>('User', UserSchema, 'users');
