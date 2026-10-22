import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authenticate';
import { CafeItem } from '../models/CafeItem';
import { CafeLayout } from '../models/CafeLayout';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { z } from 'zod';

const purchaseSchema = z.object({
  itemId: z.string().min(1),
});

const layoutSchema = z.object({
  roomTheme: z.string().optional(),
  placements: z.array(
    z.object({
      instanceId: z.string(),
      itemId: z.string(),
      slotX: z.number().int().min(0),
      slotY: z.number().int().min(0),
    })
  ).optional(),
});

export async function getCafe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let layout = await CafeLayout.findOne({ userId: req.userId });
    if (!layout) {
      layout = await CafeLayout.create({
        userId: req.userId,
        roomTheme: 'cozy-brown',
        inventory: [],
        placements: [],
      });
    }
    const user = await User.findById(req.userId, 'beanBalance');
    res.json({ success: true, data: { layout, beanBalance: user?.beanBalance ?? 0 } });
  } catch (err) {
    next(err);
  }
}

export async function getCatalog(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await CafeItem.find().sort({ category: 1, sortOrder: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function getInventory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const layout = await CafeLayout.findOne({ userId: req.userId });
    res.json({ success: true, data: layout?.inventory ?? [] });
  } catch (err) {
    next(err);
  }
}

export async function purchaseItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { itemId } = purchaseSchema.parse(req.body);

    const catalogItem = await CafeItem.findOne({ itemId });
    if (!catalogItem) return next(createError('Item not found in catalog.', 404));

    const session = await mongoose.startSession();
    let updatedLayout;

    try {
      await session.withTransaction(async () => {
        // Re-fetch user balance inside transaction
        const user = await User.findById(req.userId).session(session);
        if (!user) throw createError('User not found.', 404);

        if (user.beanBalance < catalogItem.price) {
          throw createError(
            `Insufficient beans. You need ${catalogItem.price} beans but have ${user.beanBalance}.`,
            402
          );
        }

        const layout = await CafeLayout.findOne({ userId: req.userId }).session(session);
        if (!layout) throw createError('Café layout not found.', 404);

        // Check if already owned and non-repeatable
        if (!catalogItem.isRepeatable) {
          const alreadyOwned = layout.inventory.some((inv) => inv.itemId === itemId);
          if (alreadyOwned) throw createError('You already own this item.', 409);
        }

        // Deduct beans
        await User.findByIdAndUpdate(
          req.userId,
          { $inc: { beanBalance: -catalogItem.price } },
          { session }
        );

        // Add to inventory
        updatedLayout = await CafeLayout.findOneAndUpdate(
          { userId: req.userId },
          {
            $push: {
              inventory: { itemId, purchasedAt: new Date(), quantity: 1 },
            },
          },
          { new: true, session }
        );
      });
    } finally {
      await session.endSession();
    }

    const updatedUser = await User.findById(req.userId, 'beanBalance');
    res.json({
      success: true,
      message: `You purchased ${catalogItem.name}!`,
      data: { layout: updatedLayout, newBeanBalance: updatedUser?.beanBalance ?? 0 },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLayout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = layoutSchema.parse(req.body);

    const updateFields: Record<string, unknown> = {};
    if (data.roomTheme) updateFields.roomTheme = data.roomTheme;
    if (data.placements !== undefined) {
      // Validate that placed items are owned
      if (data.placements.length > 0) {
        const layout = await CafeLayout.findOne({ userId: req.userId });
        if (layout) {
          const ownedIds = layout.inventory.map((i) => i.itemId);
          const invalid = data.placements.filter((p) => !ownedIds.includes(p.itemId));
          if (invalid.length > 0) {
            return next(createError(`You do not own item(s): ${invalid.map((i) => i.itemId).join(', ')}`, 403));
          }
        }
      }
      updateFields.placements = data.placements;
    }

    const updated = await CafeLayout.findOneAndUpdate(
      { userId: req.userId },
      { $set: updateFields },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
