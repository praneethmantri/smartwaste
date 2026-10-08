import { Router } from 'express';
import {
  getSchedules,
  getServiceZones,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/scheduleController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Service zones lookup is accessible to all logged in users
router.get('/zones', authenticateJWT, getServiceZones);

// Schedules viewable by all logged-in users
router.get('/', authenticateJWT, getSchedules);

// Admin-only mutations
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createSchedule);
router.patch('/:id', authenticateJWT, authorizeRoles('ADMIN'), updateSchedule);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteSchedule);

export default router;
