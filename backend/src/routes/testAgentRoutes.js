import { Router } from 'express';
import {
  getConnectionStatus,
  getEpics,
  getStoriesByEpics,
  getStories,
  generate,
  publishToJira,
  exportMarkdown
} from '../controllers/testAgentController.js';

const router = Router();

router.get('/test-agent/connection', getConnectionStatus);
router.get('/test-agent/epics', getEpics);
router.post('/test-agent/stories-by-epics', getStoriesByEpics);
router.get('/test-agent/stories', getStories);
router.post('/test-agent/generate', generate);
router.post('/test-agent/publish', publishToJira);
router.post('/test-agent/export/markdown', exportMarkdown);

export default router;
