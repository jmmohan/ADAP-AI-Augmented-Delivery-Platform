import { Router } from 'express';
import { validate, cloneRepo, pushCode, createPR } from '../controllers/gitController.js';

const router = Router();

router.post('/git/validate', validate);
router.post('/git/clone', cloneRepo);
router.post('/git/push', pushCode);
router.post('/git/pr', createPR);

export default router;
