import { Router } from 'express';
import {
  getTransactions, createTransaction, getTransaction,
  updateTransaction, deleteTransaction, getMonthSummary,
} from '../controllers/transactionController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.get('/summary', getMonthSummary);
router.get('/:id', getTransaction);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
