import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import { CafeItem } from '../models/CafeItem';

const CATALOG = [
  // Plants
  { itemId: 'plant-cactus', name: 'Cactus', category: 'plants', description: 'A cheerful little cactus.', price: 15, assetKey: 'plant_cactus', width: 1, height: 1, isRepeatable: false, sortOrder: 1 },
  { itemId: 'plant-fern', name: 'Hanging Fern', category: 'plants', description: 'A lush hanging fern for the corner.', price: 20, assetKey: 'plant_fern', width: 1, height: 2, isRepeatable: false, sortOrder: 2 },
  { itemId: 'plant-bonsai', name: 'Bonsai Tree', category: 'plants', description: 'A peaceful miniature bonsai.', price: 35, assetKey: 'plant_bonsai', width: 1, height: 2, isRepeatable: false, sortOrder: 3 },
  { itemId: 'plant-sunflower', name: 'Sunflower Pot', category: 'plants', description: 'Bright and sunny!', price: 25, assetKey: 'plant_sunflower', width: 1, height: 1, isRepeatable: true, sortOrder: 4 },
  // Furniture
  { itemId: 'table-wood', name: 'Wooden Table', category: 'furniture', description: 'A cozy round wooden table.', price: 40, assetKey: 'table_wood', width: 2, height: 2, isRepeatable: true, sortOrder: 1 },
  { itemId: 'chair-cushion', name: 'Cushion Chair', category: 'furniture', description: 'A soft cushioned chair.', price: 30, assetKey: 'chair_cushion', width: 1, height: 1, isRepeatable: true, sortOrder: 2 },
  { itemId: 'bookshelf-tall', name: 'Tall Bookshelf', category: 'furniture', description: 'Packed with cozy reads.', price: 50, assetKey: 'bookshelf_tall', width: 1, height: 3, isRepeatable: false, sortOrder: 3 },
  { itemId: 'sofa-cozy', name: 'Cozy Sofa', category: 'furniture', description: 'A plush two-seater sofa.', price: 60, assetKey: 'sofa_cozy', width: 3, height: 1, isRepeatable: false, sortOrder: 4 },
  { itemId: 'coffee-machine-deluxe', name: 'Deluxe Coffee Machine', category: 'furniture', description: 'Upgrade your brew station!', price: 80, assetKey: 'coffee_machine_deluxe', width: 2, height: 2, isRepeatable: false, sortOrder: 5 },
  // Decorations
  { itemId: 'rug-checkered', name: 'Checkered Rug', category: 'decorations', description: 'A classic checkered floor rug.', price: 25, assetKey: 'rug_checkered', width: 3, height: 2, isRepeatable: false, sortOrder: 1 },
  { itemId: 'wall-art-coffee', name: 'Coffee Art Print', category: 'decorations', description: 'A framed coffee art print.', price: 20, assetKey: 'wall_art_coffee', width: 1, height: 1, isRepeatable: false, sortOrder: 2 },
  { itemId: 'wall-clock', name: 'Wall Clock', category: 'decorations', description: 'A vintage wall clock.', price: 15, assetKey: 'wall_clock', width: 1, height: 1, isRepeatable: false, sortOrder: 3 },
  { itemId: 'chalkboard', name: 'Chalkboard Menu', category: 'decorations', description: 'Write your daily specials!', price: 30, assetKey: 'chalkboard', width: 2, height: 2, isRepeatable: false, sortOrder: 4 },
  // Lighting
  { itemId: 'lamp-floor', name: 'Floor Lamp', category: 'lighting', description: 'A warm standing floor lamp.', price: 35, assetKey: 'lamp_floor', width: 1, height: 2, isRepeatable: true, sortOrder: 1 },
  { itemId: 'lamp-fairy', name: 'Fairy Lights', category: 'lighting', description: 'Twinkling fairy lights along the wall.', price: 20, assetKey: 'lamp_fairy', width: 3, height: 1, isRepeatable: false, sortOrder: 2 },
  { itemId: 'lantern-paper', name: 'Paper Lantern', category: 'lighting', description: 'A soft paper lantern.', price: 15, assetKey: 'lantern_paper', width: 1, height: 1, isRepeatable: true, sortOrder: 3 },
  // Companions
  { itemId: 'companion-cat', name: 'Café Cat', category: 'companions', description: 'A sleepy tabby cat for your café.', price: 50, assetKey: 'companion_cat', width: 1, height: 1, isRepeatable: false, sortOrder: 1 },
  { itemId: 'companion-plant-buddy', name: 'Plant Buddy', category: 'companions', description: 'A tiny character who waters your plants.', price: 45, assetKey: 'companion_plant_buddy', width: 1, height: 1, isRepeatable: false, sortOrder: 2 },
];

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB');

  for (const item of CATALOG) {
    await CafeItem.findOneAndUpdate({ itemId: item.itemId }, item, { upsert: true, new: true });
    console.log(`  ✓ ${item.name}`);
  }

  console.log(`\n✅ Seeded ${CATALOG.length} café items.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
