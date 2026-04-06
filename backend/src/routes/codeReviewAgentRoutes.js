import { Router } from 'express';
import { scan, review, fix, apply, validateLocal } from '../controllers/codeReviewAgentController.js';

const router = Router();

router.post('/codereview-agent/validate-local', validateLocal);
router.post('/codereview-agent/scan-files', scan);
router.post('/codereview-agent/review', review);
router.post('/codereview-agent/fix', fix);
router.post('/codereview-agent/apply-fixes', apply);

export default router;
