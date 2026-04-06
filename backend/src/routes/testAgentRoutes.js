import { Router } from 'express';
import { getStories, generate } from '../controllers/testAgentController.js';

const router = Router();

router.get('/test-agent/stories', getStories);
router.post('/test-agent/generate', generate);

export default router;
