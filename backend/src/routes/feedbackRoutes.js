import { Router } from 'express';
import { createFeedback, getFeedback } from '../controllers/feedbackController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', createFeedback);
router.get('/', authorizeRoles('ADMIN', 'CITIZEN'), getFeedback);

export default router;
