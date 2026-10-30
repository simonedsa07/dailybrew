import { Router } from 'express';
import { createDailyEntry, getDailyEntries, getDailyEntry, upsertDailyEntry } from '../controllers/journalController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', getDailyEntries);
router.post('/:date', createDailyEntry);
router.get('/:date', getDailyEntry);
router.put('/:date', upsertDailyEntry);

export default router;
