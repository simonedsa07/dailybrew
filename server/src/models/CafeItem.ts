import mongoose, { Document, Schema } from 'mongoose';

// Global catalog item — not user-specific
export interface ICafeItem extends Document {
  itemId: string; // unique slug, e.g. 'plant-cactus'
  name: string;
  category: string;
  description: string;
  price: number; // beans
  assetKey: string; // corresponds to a frontend asset key
  width: number; // grid columns
  height: number; // grid rows
  isRepeatable: boolean; // can the user buy more than one?
  sortOrder: number;
}

const cafeItemSchema = new Schema<ICafeItem>({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['plants', 'furniture', 'decorations', 'companions', 'lighting'],
  },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  assetKey: { type: String, required: true },
  width: { type: Number, default: 1 },
  height: { type: Number, default: 1 },
  isRepeatable: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
});

export const CafeItem = mongoose.model<ICafeItem>('CafeItem', cafeItemSchema);
