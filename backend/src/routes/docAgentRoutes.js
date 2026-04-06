import { Router } from 'express';
import { getItems, generate } from '../controllers/docAgentController.js';

const router = Router();

router.get('/doc-agent/items', getItems);
router.post('/doc-agent/generate', generate);

export default router;
