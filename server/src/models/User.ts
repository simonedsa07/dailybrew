import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreferences {
  currency: string;
  waterTarget: number; // ml per day
  monthlyBudget?: number;
  theme: 'default' | 'dark' | 'sakura';
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  preferences: IUserPreferences;
  beanBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    preferences: {
      currency: { type: String, default: 'INR' },
      waterTarget: { type: Number, default: 2000 },
      monthlyBudget: { type: Number },
      theme: { type: String, enum: ['default', 'dark', 'sakura'], default: 'default' },
    },
    beanBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);



export const User = mongoose.model<IUser>('User', userSchema);
