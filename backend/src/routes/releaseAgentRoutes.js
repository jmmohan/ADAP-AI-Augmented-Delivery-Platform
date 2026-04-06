import { Router } from 'express';
import { getItems, generate } from '../controllers/releaseAgentController.js';

const router = Router();

router.get('/release-agent/items', getItems);
router.post('/release-agent/generate', generate);

export default router;
