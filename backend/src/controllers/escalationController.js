import prisma from '../config/db.js';
import {
  checkAndEscalateComplaints,
  getEscalationIntervalMs,
  reassignEscalatedComplaint,
  prioritizeEscalatedComplaint,
  recordCollectorInstructions,
  resolveEscalatedComplaint,
} from '../services/escalationService.js';
import {
  prioritizeComplaintSchema,
  collectorInstructionSchema,
  resolveComplaintSchema,
} from '../validators/schemas.js';

/**
 * Returns escalation configuration and SLA thresholds.
 */
export const getEscalationConfig = async (req, res, next) => {
  try {
    const l1Ms = getEscalationIntervalMs(1);
    const l2Ms = getEscalationIntervalMs(2);

    res.json({
      success: true,
      data: {
        level1: {
          authority: 'Municipal Administrator',
          role: 'ADMIN',
          intervalHours: l1Ms / (3600 * 1000),
          intervalMs: l1Ms,
        },
        level2: {
          authority: 'Higher Municipal Authority',
          role: 'MUNICIPAL_OFFICER',
          intervalHours: l2Ms / (3600 * 1000),
          intervalMs: l2Ms,
        },
        level3: {
          authority: 'District Collector Office',
          role: 'COLLECTOR_OFFICE',
          description: 'Simulated government escalation workflow (EcoVision Demonstration)',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger an escalation evaluation check.
 * Useful for automated tests and cron hooks.
 */
export const triggerEscalationCheck = async (req, res, next) => {
  try {
    const { force, reference } = req.body || {};
    const results = await checkAndEscalateComplaints({
      force: Boolean(force),
      reference: reference || null,
    });

    res.json({
      success: true,
      message: 'Escalation check completed.',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve escalated complaints for Municipal Officers or Collector Office dashboards.
 */
export const getEscalatedComplaints = async (req, res, next) => {
  try {
    const {
      level,
      status,
      priority,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const userRole = req.user.role;
    const where = {};

    // By default, Collector Office sees Level 3 complaints (and any emergency Level 2s)
    if (userRole === 'COLLECTOR_OFFICE') {
      if (level) {
        where.escalationLevel = Number(level);
      } else {
        where.escalationLevel = { gte: 2 }; // Officers and Collector can view all escalations
      }
    } else if (userRole === 'MUNICIPAL_OFFICER') {
      if (level) {
        where.escalationLevel = Number(level);
      } else {
        where.escalationLevel = { gte: 2 };
      }
    } else if (userRole === 'ADMIN') {
      if (level) {
        where.escalationLevel = Number(level);
      } else {
        where.escalationLevel = { gte: 1 };
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Escalated complaints view requires administrative or officer permissions.',
      });
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { complaintReference: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const [total, complaints, l2Count, l3Count] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { resolutionDeadline: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          citizen: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
          assignedWorker: {
            include: {
              user: { select: { id: true, fullName: true, phone: true } },
              serviceZone: true,
            },
          },
          serviceZone: true,
          escalationEvents: {
            orderBy: { createdAt: 'desc' },
            include: {
              actionBy: { select: { id: true, fullName: true, role: true } },
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.complaint.count({ where: { escalationLevel: 2, status: { notIn: ['COMPLETED', 'RESOLVED', 'REJECTED'] } } }),
      prisma.complaint.count({ where: { escalationLevel: 3, status: { notIn: ['COMPLETED', 'RESOLVED', 'REJECTED'] } } }),
    ]);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
      summary: {
        totalEscalated: l2Count + l3Count,
        level2Active: l2Count,
        level3Critical: l3Count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reassign an escalated complaint.
 */
export const handleReassign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { workerId, notes } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required.' });
    }

    const updated = await reassignEscalatedComplaint({
      complaintId: id,
      workerId,
      notes,
      actionById: req.user.id,
      officerRole: req.user.role,
    });

    res.json({
      success: true,
      message: 'Complaint successfully reassigned to worker.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust priority of an escalated complaint.
 */
export const handlePrioritize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority, notes } = prioritizeComplaintSchema.parse(req.body);

    const updated = await prioritizeEscalatedComplaint({
      complaintId: id,
      priority,
      notes,
      actionById: req.user.id,
      officerRole: req.user.role,
    });

    res.json({
      success: true,
      message: `Complaint priority elevated to ${priority}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record District Collector Office official directives / instructions.
 */
export const handleCollectorInstructions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = collectorInstructionSchema.parse(req.body);

    const updated = await recordCollectorInstructions({
      complaintId: id,
      instructions: validated.instructions,
      assignedWorkerId: validated.assignedWorkerId,
      priority: validated.priority,
      notes: validated.notes,
      actionById: req.user.id,
    });

    res.json({
      success: true,
      message: 'District Collector Office directive recorded successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct resolution of escalated complaint by authorized Municipal Officer or Collector.
 */
export const handleResolveEscalated = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = resolveComplaintSchema.parse(req.body);

    const updated = await resolveEscalatedComplaint({
      complaintId: id,
      notes,
      actionById: req.user.id,
      officerRole: req.user.role,
    });

    res.json({
      success: true,
      message: 'Complaint resolved and escalation cycle concluded.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
