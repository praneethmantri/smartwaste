import prisma from '../config/db.js';
import { getRelativeUploadPath } from '../config/multer.js';
import { createNotification } from '../services/notificationService.js';
import { completionProofSchema } from '../validators/schemas.js';

export const getWorkers = async (req, res, next) => {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        serviceZone: true,
        _count: {
          select: {
            assignedComplaints: {
              where: {
                status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
              },
            },
          },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    res.json({
      success: true,
      data: workers,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkerTasks = async (req, res, next) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
      include: { serviceZone: true },
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not linked with this user account.',
      });
    }

    const { status } = req.query;
    const where = { assignedWorkerId: worker.id };
    if (status) {
      where.status = status;
    }

    const tasks = await prisma.complaint.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        citizen: {
          select: { id: true, fullName: true, phone: true },
        },
        serviceZone: true,
        completionProofs: true,
      },
    });

    // Counts
    const counts = {
      assigned: await prisma.complaint.count({ where: { assignedWorkerId: worker.id, status: 'ASSIGNED' } }),
      inProgress: await prisma.complaint.count({ where: { assignedWorkerId: worker.id, status: 'IN_PROGRESS' } }),
      completed: await prisma.complaint.count({ where: { assignedWorkerId: worker.id, status: 'COMPLETED' } }),
    };

    // Today's schedule for this worker
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaySchedules = await prisma.collectionSchedule.findMany({
      where: {
        OR: [
          { workerId: worker.id },
          { serviceZoneId: worker.serviceZoneId },
        ],
        collectionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { serviceZone: true },
    });

    res.json({
      success: true,
      data: {
        worker,
        counts,
        tasks,
        todaySchedules,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return res.status(403).json({ success: false, message: 'Worker profile required.' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Task complaint not found.' });
    }

    if (complaint.assignedWorkerId !== worker.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update tasks assigned directly to you.',
      });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: id,
        oldStatus: complaint.status,
        newStatus: status,
        changedById: req.user.id,
        notes: notes || `Worker updated status to ${status}`,
      },
    });

    // Notify citizen
    await createNotification({
      userId: complaint.citizenId,
      complaintId: id,
      title: `Task Status: ${status.replace('_', ' ')}`,
      message: `Sanitation worker has marked your complaint ${complaint.complaintReference} as ${status.replace('_', ' ')}.`,
      type: `STATUS_${status}`,
    });

    res.json({
      success: true,
      message: `Task status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadCompletionProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = completionProofSchema.parse(req.body);

    const worker = await prisma.worker.findUnique({ where: { userId: req.user.id } });
    if (!worker) {
      return res.status(403).json({ success: false, message: 'Worker profile required.' });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.assignedWorkerId !== worker.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload completion proof for tasks assigned to you.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A clear photo proof of completed waste clearance is required.',
      });
    }

    const imageUrl = getRelativeUploadPath(req.file);

    const [proof, updatedComplaint] = await prisma.$transaction([
      prisma.completionProof.create({
        data: {
          complaintId: id,
          workerId: worker.id,
          imageUrl,
          notes: notes || 'Waste cleared and site sanitized.',
        },
      }),
      prisma.complaint.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
      prisma.complaintStatusHistory.create({
        data: {
          complaintId: id,
          oldStatus: complaint.status,
          newStatus: 'COMPLETED',
          changedById: req.user.id,
          notes: notes ? `Completed with proof: ${notes}` : 'Completed with photo verification proof.',
        },
      }),
    ]);

    // Send notification to citizen
    await createNotification({
      userId: complaint.citizenId,
      complaintId: id,
      title: 'Waste Collected! 🌟',
      message: `Your complaint ${complaint.complaintReference} has been resolved! Please tap to review completion proof and share your feedback.`,
      type: 'COMPLAINT_COMPLETED',
    });

    res.json({
      success: true,
      message: 'Work completed and verification proof uploaded successfully.',
      data: {
        proof,
        complaint: updatedComplaint,
      },
    });
  } catch (error) {
    next(error);
  }
};
