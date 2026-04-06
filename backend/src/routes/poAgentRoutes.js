import { Router } from 'express';
import {
  connect,
  exportMarkdown,
  generate,
  getEpics,
  healthCheck,
  publish
} from '../controllers/poAgentController.js';

const router = Router();

router.get('/health', healthCheck);
router.post('/po-agent/connect', connect);
router.get('/po-agent/epics', getEpics);
router.post('/po-agent/generate', generate);
router.post('/po-agent/publish', publish);
router.post('/po-agent/export/markdown', exportMarkdown);

export default router;
