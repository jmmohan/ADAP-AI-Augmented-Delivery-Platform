import { Router } from 'express';
import { getItems, generate } from '../controllers/reviewAgentController.js';

const router = Router();

router.get('/review-agent/items', getItems);
router.post('/review-agent/generate', generate);

export default router;
