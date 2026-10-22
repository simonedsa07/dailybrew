import mongoose, { Document, Schema } from 'mongoose';

// User's owned café items
export interface ICafeInventoryItem {
  itemId: string;
  purchasedAt: Date;
  quantity: number;
}

// Placed furniture in the room
export interface IPlacement {
  instanceId: string; // unique per placed item
  itemId: string;
  slotX: number;
  slotY: number;
}

export interface ICafeLayout extends Document {
  userId: mongoose.Types.ObjectId;
  roomTheme: string;
  inventory: ICafeInventoryItem[];
  placements: IPlacement[];
  updatedAt: Date;
}

const cafeLayoutSchema = new Schema<ICafeLayout>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    roomTheme: { type: String, default: 'cozy-brown' },
    inventory: [
      {
        itemId: { type: String, required: true },
        purchasedAt: { type: Date, default: Date.now },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
    placements: [
      {
        instanceId: { type: String, required: true },
        itemId: { type: String, required: true },
        slotX: { type: Number, required: true },
        slotY: { type: Number, required: true },
      },
    ],
  },
  { timestamps: { updatedAt: true, createdAt: true } }
);

export const CafeLayout = mongoose.model<ICafeLayout>('CafeLayout', cafeLayoutSchema);
