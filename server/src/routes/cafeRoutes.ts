import { Router } from 'express';
import { getCafe, getCatalog, getInventory, purchaseItem, updateLayout } from '../controllers/cafeController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', getCafe);
router.get('/items', getCatalog);
router.get('/inventory', getInventory);
router.post('/purchases', purchaseItem);
router.put('/layout', updateLayout);

export default router;
