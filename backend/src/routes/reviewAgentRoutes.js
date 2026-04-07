import { Router } from 'express';
import {
  getConnectionStatus,
  getEpics,
  getArtifactsByEpics,
  getItems,
  generate,
  publishToJira,
  exportMarkdown
} from '../controllers/reviewAgentController.js';

const router = Router();

router.get('/review-agent/connection', getConnectionStatus);
router.get('/review-agent/epics', getEpics);
router.post('/review-agent/artifacts-by-epics', getArtifactsByEpics);
router.get('/review-agent/items', getItems);
router.post('/review-agent/generate', generate);
router.post('/review-agent/publish', publishToJira);
router.post('/review-agent/export/markdown', exportMarkdown);

export default router;
