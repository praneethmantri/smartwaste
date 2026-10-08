import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  reopenComplaint,
} from '../controllers/complaintController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', upload.single('image'), createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.patch('/:id/status', authorizeRoles('WORKER', 'ADMIN'), updateComplaintStatus);
router.patch('/:id/assign', authorizeRoles('ADMIN'), assignComplaint);
router.post('/:id/reopen', reopenComplaint);

export default router;
