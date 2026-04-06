import { Router } from 'express';
import { getItems, generate } from '../controllers/perfAgentController.js';

const router = Router();

router.get('/perf-agent/items', getItems);
router.post('/perf-agent/generate', generate);

export default router;
