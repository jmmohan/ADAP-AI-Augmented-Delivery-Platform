import { Router } from 'express';
import { getArtifacts, generate } from '../controllers/deployAgentController.js';

const router = Router();

router.get('/deploy-agent/artifacts', getArtifacts);
router.post('/deploy-agent/generate', generate);

export default router;
