import { Router } from 'express';
import { handleListPrompts, handleGetPrompt, handleUpdatePrompt, handleResetPrompt } from '../controllers/promptController.js';

const router = Router();

router.get('/prompts', handleListPrompts);
router.get('/prompts/:agentId', handleGetPrompt);
router.put('/prompts/:agentId', handleUpdatePrompt);
router.post('/prompts/:agentId/reset', handleResetPrompt);

export default router;
