import { Router } from 'express';
import {
  getWorkers,
  getWorkerTasks,
  updateTaskStatus,
  uploadCompletionProof,
} from '../controllers/workerController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('ADMIN'), getWorkers);
router.get('/tasks', authorizeRoles('WORKER'), getWorkerTasks);
router.patch('/tasks/:id/status', authorizeRoles('WORKER'), updateTaskStatus);
router.post(
  '/tasks/:id/completion-proof',
  authorizeRoles('WORKER'),
  upload.single('image'),
  uploadCompletionProof
);

export default router;
