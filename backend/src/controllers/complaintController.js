import prisma from '../config/db.js';
import { getRelativeUploadPath, uploadImageToStorage } from '../config/multer.js';
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  assignComplaintSchema,
} from '../validators/schemas.js';
import { createNotification, notifyAdmins } from '../services/notificationService.js';

// Helper to generate reference: SW-YYYY-XXXX
const generateReference = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count();
  let ref = `SW-${year}-${String(count + 1).padStart(4, '0')}`;
  
  // Verify collision in loop
  let exists = await prisma.complaint.findUnique({ where: { complaintReference: ref } });
  while (exists) {
    ref = `SW-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    exists = await prisma.complaint.findUnique({ where: { complaintReference: ref } });
  }
  return ref;
};

export const createComplaint = async (req, res, next) => {
  try {
    const validatedData = createComplaintSchema.parse(req.body);
    const citizenId = req.user.id;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImageToStorage(req.file, 'complaints');
    }

    const complaintReference = await generateReference();

    // Auto-match service zone if not provided based on zone list
    let serviceZoneId = validatedData.serviceZoneId;
    if (!serviceZoneId) {
      const defaultZone = await prisma.serviceZone.findFirst();
      if (defaultZone) serviceZoneId = defaultZone.id;
    }

    const complaint = await prisma.complaint.create({
      data: {
        complaintReference,
        citizenId,
        wasteType: validatedData.wasteType,
        category: validatedData.category,
        description: validatedData.description,
        priority: validatedData.priority,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        address: validatedData.address,
        imageUrl,
        serviceZoneId,
        status: 'SUBMITTED',
      },
      include: {
        citizen: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        serviceZone: true,
      },
    });

    // Record initial status history
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizenId,
        notes: 'Complaint submitted by citizen with location coordinates and details.',
      },
    });

    // In-app notification for Citizen
    await createNotification({
      userId: citizenId,
      complaintId: complaint.id,
      title: 'Complaint Registered 📋',
      message: `Your complaint ${complaint.complaintReference} for ${complaint.wasteType} has been successfully registered.`,
      type: 'COMPLAINT_SUBMITTED',
    });

    // In-app notification for Administrators
    await notifyAdmins({
      complaintId: complaint.id,
      title: 'New Complaint Logged 📢',
      message: `New complaint ${complaint.complaintReference} (${complaint.category}) received at ${complaint.address}.`,
      type: 'ADMIN_ALERT',
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const {
      status,
      wasteType,
      category,
      priority,
      serviceZoneId,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};

    // Role-based scoping
    if (req.user.role === 'CITIZEN') {
      where.citizenId = req.user.id;
    } else if (req.user.role === 'WORKER') {
      const worker = req.user.worker;
      if (!worker) {
        return res.status(403).json({ success: false, message: 'Worker profile not linked.' });
      }
      // Workers only access their assigned tasks
      where.assignedWorkerId = worker.id;
    }

    // Base scope for counting total/pending/completed for this caller
    const baseScope = {};
    if (req.user.role === 'CITIZEN') baseScope.citizenId = req.user.id;
    if (req.user.role === 'WORKER' && req.user.worker) baseScope.assignedWorkerId = req.user.worker.id;

    // Filters
    if (status) where.status = status;
    if (wasteType) where.wasteType = wasteType;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (serviceZoneId) where.serviceZoneId = serviceZoneId;

    if (search) {
      const searchOr = [
        { complaintReference: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, complaints, pendingCount, inProgressCount, completedCount, totalScoped] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          citizen: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          assignedWorker: {
            include: {
              user: {
                select: { id: true, fullName: true, phone: true },
              },
            },
          },
          serviceZone: true,
          feedback: true,
        },
      }),
      prisma.complaint.count({ where: { ...baseScope, status: { in: ['SUBMITTED', 'ASSIGNED'] } } }),
      prisma.complaint.count({ where: { ...baseScope, status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { ...baseScope, status: 'COMPLETED' } }),
      prisma.complaint.count({ where: baseScope }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
        complaints,
        counts: {
          total: totalScoped,
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: {
          select: { id: true, fullName: true, phone: true, email: true, address: true },
        },
        assignedWorker: {
          include: {
            user: {
              select: { id: true, fullName: true, phone: true, email: true },
            },
            serviceZone: true,
          },
        },
        serviceZone: true,
        statusHistory: {
          orderBy: { changedAt: 'asc' },
          include: {
            changedBy: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        completionProofs: {
          orderBy: { createdAt: 'desc' },
          include: {
            worker: {
              include: {
                user: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
        feedback: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found.',
      });
    }

    // Role verification
    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own complaints.',
      });
    }

    if (req.user.role === 'WORKER') {
      const worker = req.user.worker;
      if (!worker || complaint.assignedWorkerId !== worker.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view tasks assigned to you.',
        });
      }
    }

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = updateComplaintStatusSchema.parse(req.body);

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role === 'WORKER') {
      const worker = req.user.worker;
      if (!worker || existing.assignedWorkerId !== worker.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update tasks assigned directly to you.',
        });
      }
    }

    const completedAt = status === 'COMPLETED' ? new Date() : existing.completedAt;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
      include: {
        citizen: true,
        assignedWorker: {
          include: { user: true },
        },
      },
    });

    // Record audit trail in history
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: id,
        oldStatus: existing.status,
        newStatus: status,
        changedById: req.user.id,
        notes: notes || `Status updated from ${existing.status} to ${status}`,
      },
    });

    // Notify citizen
    await createNotification({
      userId: existing.citizenId,
      complaintId: id,
      title: `Complaint Status: ${status}`,
      message: `Your complaint ${existing.complaintReference} is now ${status.replace('_', ' ')}. Notes: ${notes || 'Updated by sanitation staff.'}`,
      type: `STATUS_${status}`,
    });

    res.json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workerId, serviceZoneId, notes } = assignComplaintSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Sanitation worker not found.' });
    }

    const updateData = {
      assignedWorkerId: workerId,
      status: complaint.status === 'SUBMITTED' ? 'ASSIGNED' : complaint.status,
    };
    if (serviceZoneId) {
      updateData.serviceZoneId = serviceZoneId;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        citizen: true,
        assignedWorker: {
          include: { user: true },
        },
        serviceZone: true,
      },
    });

    // Log history
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: id,
        oldStatus: complaint.status,
        newStatus: updateData.status,
        changedById: req.user.id,
        notes: notes || `Assigned to worker ${worker.user.fullName} (${worker.employeeCode}) by administrator.`,
      },
    });

    // Notify Worker
    await createNotification({
      userId: worker.userId,
      complaintId: id,
      title: 'New Task Assigned 🧹',
      message: `Complaint ${complaint.complaintReference} at ${complaint.address} has been assigned to you.`,
      type: 'TASK_ASSIGNED',
    });

    // Notify Citizen
    await createNotification({
      userId: complaint.citizenId,
      complaintId: id,
      title: 'Worker Assigned 👷',
      message: `Worker ${worker.user.fullName} has been assigned to attend your complaint ${complaint.complaintReference}.`,
      type: 'COMPLAINT_ASSIGNED',
    });

    res.json({
      success: true,
      message: 'Worker assigned successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const reopenComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { assignedWorker: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (req.user.role === 'CITIZEN' && complaint.citizenId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only reopen your own complaints.' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'REOPENED',
      },
    });

    // Log history
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: id,
        oldStatus: complaint.status,
        newStatus: 'REOPENED',
        changedById: req.user.id,
        notes: notes || 'Citizen reopened the complaint citing incomplete resolution.',
      },
    });

    // Notify Admin
    await notifyAdmins({
      complaintId: id,
      title: 'Complaint Reopened ⚠️',
      message: `Citizen reopened complaint ${complaint.complaintReference}: ${notes || 'Issue not resolved.'}`,
      type: 'ADMIN_ALERT',
    });

    // Notify Worker if previously assigned
    if (complaint.assignedWorker?.userId) {
      await createNotification({
        userId: complaint.assignedWorker.userId,
        complaintId: id,
        title: 'Task Reopened ⚠️',
        message: `Complaint ${complaint.complaintReference} was reopened by citizen. Please verify the location.`,
        type: 'TASK_REOPENED',
      });
    }

    res.json({
      success: true,
      message: 'Complaint reopened successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
