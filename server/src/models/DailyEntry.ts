import mongoose, { Document, Schema } from 'mongoose';

export type Mood = 'happy' | 'calm' | 'okay' | 'tired' | 'stressed' | 'sad' | 'lovely' | 'good' | 'low';

export interface IDailyEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // 'YYYY-MM-DD'
  mood?: Mood;
  note?: string;
  gratitude?: string;
  waterIntake: number; // glasses or ml consumed today
  createdAt: Date;
  updatedAt: Date;
}

const dailyEntrySchema = new Schema<IDailyEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    mood: {
      type: String,
      enum: ['happy', 'calm', 'okay', 'tired', 'stressed', 'sad', 'lovely', 'good', 'low'],
    },
    note: { type: String, trim: true, maxlength: 2000 },
    gratitude: { type: String, trim: true, maxlength: 500 },
    waterIntake: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// One entry per user per date
dailyEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyEntry = mongoose.model<IDailyEntry>('DailyEntry', dailyEntrySchema);
