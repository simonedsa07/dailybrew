import { Router } from 'express';
import {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
} from '../controllers/budgetController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/budgets', getBudgets);
router.put('/budgets/:month', upsertBudget);
router.delete('/budgets/:month', deleteBudget);

router.get('/savings-goals', getSavingsGoals);
router.post('/savings-goals', createSavingsGoal);
router.patch('/savings-goals/:id', updateSavingsGoal);
router.delete('/savings-goals/:id', deleteSavingsGoal);

export default router;

