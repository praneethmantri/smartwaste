import { Router } from 'express';
import {
  getStatistics,
  getAnalytics,
  getUsers,
  createWorker,
  exportComplaintsCsv,
  exportComplaintsPdf,
} from '../controllers/adminController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateJWT, authorizeRoles('ADMIN'));

router.get('/statistics', getStatistics);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/workers', createWorker);
router.get('/export/csv', exportComplaintsCsv);
router.get('/export/pdf', exportComplaintsPdf);

export default router;
