import { Router } from 'express';
import {
  getHabits, createHabit, getHabit, updateHabit, deleteHabit,
  completeHabit, uncompleteHabit, getHabitHistory,
} from '../controllers/habitController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', getHabits);
router.post('/', createHabit);
router.get('/:id', getHabit);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/completions', completeHabit);
router.delete('/:id/completions/:completionId', uncompleteHabit);
router.get('/:id/history', getHabitHistory);

export default router;
