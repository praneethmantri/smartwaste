import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { getRelativeUploadPath } from '../config/multer.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/schemas.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        worker: {
          include: {
            serviceZone: true,
          },
        },
        _count: {
          select: {
            complaints: true,
            notifications: { where: { isRead: false } },
            feedbacks: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user.id;

    const updateData = { ...validatedData };
    if (req.file) {
      updateData.profileImage = getRelativeUploadPath(req.file);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        worker: {
          include: {
            serviceZone: true,
          },
        },
      },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password provided is incorrect.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
