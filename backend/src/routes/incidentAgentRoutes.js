import { Router } from 'express';
import { getItems, generate } from '../controllers/incidentAgentController.js';

const router = Router();

router.get('/incident-agent/items', getItems);
router.post('/incident-agent/generate', generate);

export default router;
