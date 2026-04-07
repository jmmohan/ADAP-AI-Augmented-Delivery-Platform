import { Router } from 'express';
import {
  getSettings,
  saveJira,
  removeJira,
  saveGit,
  removeGit,
  saveModel
} from '../controllers/settingsController.js';

const router = Router();

router.get('/settings', getSettings);
router.post('/settings/jira', saveJira);
router.delete('/settings/jira', removeJira);
router.post('/settings/git', saveGit);
router.delete('/settings/git', removeGit);
router.post('/settings/model', saveModel);

export default router;
