import { Router } from 'express';
import { getStories, generate } from '../controllers/archAgentController.js';

const router = Router();

router.get('/arch-agent/stories', getStories);
router.post('/arch-agent/generate', generate);

export default router;
