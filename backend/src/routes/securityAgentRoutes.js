import { Router } from 'express';
import { getItems, generate } from '../controllers/securityAgentController.js';

const router = Router();

router.get('/security-agent/items', getItems);
router.post('/security-agent/generate', generate);

export default router;
