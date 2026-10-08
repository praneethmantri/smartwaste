import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profileController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', getProfile);
router.patch('/', upload.single('profileImage'), updateProfile);
router.patch('/password', changePassword);

export default router;
