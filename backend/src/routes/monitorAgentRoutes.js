import { Router } from 'express';
import { getServices, generate } from '../controllers/monitorAgentController.js';

const router = Router();

router.get('/monitor-agent/services', getServices);
router.post('/monitor-agent/generate', generate);

export default router;
