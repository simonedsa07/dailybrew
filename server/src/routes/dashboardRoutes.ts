import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/summary', getDashboardSummary);

export default router;
