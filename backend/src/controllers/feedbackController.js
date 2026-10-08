import prisma from '../config/db.js';
import { feedbackSchema } from '../validators/schemas.js';
import { createNotification } from '../services/notificationService.js';

export const createFeedback = async (req, res, next) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const userId = req.user.id;

    // Check complaint exists and belongs to citizen
    const complaint = await prisma.complaint.findUnique({
      where: { id: data.complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.citizenId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only provide feedback for your own resolved complaints.',
      });
    }

    if (complaint.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted once the waste collection task has been marked Completed.',
      });
    }

    // Check if feedback already exists
    const existing = await prisma.feedback.findUnique({
      where: { complaintId: data.complaintId },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Feedback for this complaint has already been submitted.',
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        complaintId: data.complaintId,
        rating: data.rating,
        recommendation: data.recommendation,
        comments: data.comments,
      },
      include: {
        complaint: true,
      },
    });

    // In-app thank you notification
    await createNotification({
      userId,
      complaintId: complaint.id,
      title: 'Feedback Received ⭐',
      message: `Thank you for rating our sanitation team (${data.rating}/5 stars). Your review helps improve civic cleanliness!`,
      type: 'FEEDBACK_SUBMITTED',
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your valuable feedback!',
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'CITIZEN') {
      where.userId = req.user.id;
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, email: true },
        },
        complaint: {
          select: {
            complaintReference: true,
            wasteType: true,
            category: true,
            address: true,
            assignedWorker: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    // Summary calculation
    const count = feedbacks.length;
    const avgRating = count > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / count).toFixed(1) : 0;
    const recommendedPercent =
      count > 0 ? Math.round((feedbacks.filter((f) => f.recommendation).length / count) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalReviews: count,
          averageRating: Number(avgRating),
          recommendedPercent,
        },
        feedbacks,
      },
    });
  } catch (error) {
    next(error);
  }
};
