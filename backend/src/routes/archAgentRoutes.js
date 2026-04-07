import { Router } from 'express';
import {
  getConnectionStatus,
  getEpics,
  getStoriesByEpics,
  getStories,
  generate,
  publishToJira,
  exportMarkdown
} from '../controllers/archAgentController.js';

const router = Router();

router.get('/arch-agent/connection', getConnectionStatus);
router.get('/arch-agent/epics', getEpics);
router.post('/arch-agent/stories-by-epics', getStoriesByEpics);
router.get('/arch-agent/stories', getStories);
router.post('/arch-agent/generate', generate);
router.post('/arch-agent/publish', publishToJira);
router.post('/arch-agent/export/markdown', exportMarkdown);

export default router;
