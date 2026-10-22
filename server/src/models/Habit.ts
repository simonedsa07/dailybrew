import mongoose, { Document, Schema } from 'mongoose';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon: string;
  category: string;
  frequency: HabitFrequency;
  scheduledDays?: number[]; // 0=Sun..6=Sat for custom
  targetValue?: number;
  targetUnit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, default: '☕' },
    category: { type: String, required: true, trim: true, default: 'General' },
    frequency: {
      type: String,
      enum: ['daily', 'weekdays', 'weekends', 'custom'],
      default: 'daily',
    },
    scheduledDays: [{ type: Number, min: 0, max: 6 }],
    targetValue: { type: Number, min: 0 },
    targetUnit: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

habitSchema.index({ userId: 1, isActive: 1 });

export const Habit = mongoose.model<IHabit>('Habit', habitSchema);
