import { Router } from 'express';
import { getItems, generate } from '../controllers/complianceAgentController.js';

const router = Router();

router.get('/compliance-agent/items', getItems);
router.post('/compliance-agent/generate', generate);

export default router;
