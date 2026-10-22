import { Router } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.delete('/me', deleteAccount);

export default router;
