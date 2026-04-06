import { Router } from 'express';
import { getStories, generate } from '../controllers/codeAgentController.js';

const router = Router();

router.get('/code-agent/stories', getStories);
router.post('/code-agent/generate', generate);

export default router;
