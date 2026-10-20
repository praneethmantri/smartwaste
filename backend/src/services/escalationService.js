import prisma from '../config/db.js';
import {
  createNotification,
  notifyAdmins,
  notifyMunicipalOfficers,
  notifyCollectorOffice,
} from './notificationService.js';

/**
 * Returns the configured escalation interval in milliseconds for a given level.
 * Configurable via environment variables with support for short test intervals.
 */
export const getEscalationIntervalMs = (level = 1) => {
  // Test override flag or fast mode
  if (process.env.ESCALATION_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') {
    const testSeconds = Number(process.env.ESCALATION_TEST_SECONDS) || 5;
    return testSeconds * 1000;
  }

  if (level === 1) {
    if (process.env.ESCALATION_L1_INTERVAL_SECONDS) {
      return Number(process.env.ESCALATION_L1_INTERVAL_SECONDS) * 1000;
    }
    if (process.env.ESCALATION_L1_INTERVAL_MINUTES) {
      return Number(process.env.ESCALATION_L1_INTERVAL_MINUTES) * 60 * 1000;
    }
    const hours = Number(process.env.ESCALATION_L1_INTERVAL_HOURS) || 24;
    return hours * 3600 * 1000;
  }

  if (level === 2) {
    if (process.env.ESCALATION_L2_INTERVAL_SECONDS) {
      return Number(process.env.ESCALATION_L2_INTERVAL_SECONDS) * 1000;
    }
    if (process.env.ESCALATION_L2_INTERVAL_MINUTES) {
      return Number(process.env.ESCALATION_L2_INTERVAL_MINUTES) * 60 * 1000;
    }
    const hours = Number(process.env.ESCALATION_L2_INTERVAL_HOURS) || 24;
    return hours * 3600 * 1000;
  }

  // Level 3 default
  const hours = Number(process.env.ESCALATION_L3_INTERVAL_HOURS) || 24;
  return hours * 3600 * 1000;
};

/**
 * Calculates deadline for a given level starting from a specified date.
 */
export const calculateResolutionDeadline = (level = 1, fromDate = new Date()) => {
  const intervalMs = getEscalationIntervalMs(level);
  return new Date(new Date(fromDate).getTime() + intervalMs);
};

/**
 * Gets a system user ID to attribute automated system escalation events.
 */
const getSystemActorId = async () => {
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  return admin?.id || null;
};

/**
 * Core escalation check logic.
 * Idempotent: Can run repeatedly without creating duplicate escalations.
 * Safe against race conditions and stops after complaint is resolved.
 */
export const checkAndEscalateComplaints = async ({ force = false, reference = null } = {}) => {
  const now = new Date();
  const systemActorId = await getSystemActorId();

  // Query complaints that are:
  // 1. Not resolved (COMPLETED, RESOLVED, REJECTED)
  // 2. Not yet at maximum escalation level (level < 3)
  // 3. Deadline has expired (or forced via testing/manual trigger)
  const whereClause = {
    status: {
      notIn: ['COMPLETED', 'RESOLVED', 'REJECTED'],
    },
    escalationLevel: {
      lt: 3,
    },
  };

  if (reference) {
    whereClause.complaintReference = reference;
  }

  if (!force) {
    whereClause.resolutionDeadline = {
      lte: now,
    };
  }

  const eligibleComplaints = await prisma.complaint.findMany({
    where: whereClause,
    include: {
      citizen: { select: { id: true, fullName: true, email: true } },
      assignedWorker: { include: { user: { select: { id: true, fullName: true } } } },
    },
  });

  const results = {
    totalChecked: eligibleComplaints.length,
    escalatedToLevel2: 0,
    escalatedToLevel3: 0,
    escalatedIds: [],
  };

  for (const complaint of eligibleComplaints) {
    const currentLevel = complaint.escalationLevel || 1;

    // Check if complaint has already been resolved or escalated by another concurrent tick
    const fresh = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      select: { status: true, escalationLevel: true, resolutionDeadline: true },
    });

    if (!fresh || ['COMPLETED', 'RESOLVED', 'REJECTED'].includes(fresh.status) || fresh.escalationLevel >= 3) {
      continue;
    }

    if (currentLevel === 1) {
      const nextDeadline = calculateResolutionDeadline(2, now);

      await prisma.$transaction(async (tx) => {
        // Atomic update
        await tx.complaint.update({
          where: { id: complaint.id },
          data: {
            escalationLevel: 2,
            status: 'ESCALATED',
            resolutionDeadline: nextDeadline,
            escalatedAt: now,
          },
        });

        // Record persistent Escalation Event
        await tx.escalationEvent.create({
          data: {
            complaintId: complaint.id,
            fromLevel: 1,
            toLevel: 2,
            reason: 'Resolution deadline (24 hours SLA) exceeded at Municipal Administrator level.',
            actionTaken: 'Automated Escalation to Level 2 (Higher Municipal Authority / MUNICIPAL_OFFICER)',
            notes: 'System automated escalation scheduler detected SLA expiration.',
            actionById: systemActorId,
          },
        });

        // Record Status History for timeline continuity
        if (systemActorId) {
          await tx.complaintStatusHistory.create({
            data: {
              complaintId: complaint.id,
              oldStatus: complaint.status,
              newStatus: 'ESCALATED',
              changedById: systemActorId,
              notes: 'Automatically escalated to Level 2 (Higher Municipal Authority). SLA deadline exceeded.',
            },
          });
        }
      });

      // Send In-App Notifications
      await createNotification({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        title: 'Complaint Escalated to Level 2 ⚠️',
        message: `Your complaint ${complaint.complaintReference} has been escalated to Level 2 (Higher Municipal Authority) for priority action.`,
        type: 'COMPLAINT_ESCALATED_L2',
      });

      if (complaint.assignedWorker?.user?.id) {
        await createNotification({
          userId: complaint.assignedWorker.user.id,
          complaintId: complaint.id,
          title: 'Task Escalated to Level 2 ⚠️',
          message: `Complaint ${complaint.complaintReference} assigned to you has been escalated to Level 2 due to resolution deadline timeout.`,
          type: 'WORKER_ESCALATION_ALERT',
        });
      }

      await notifyMunicipalOfficers({
        complaintId: complaint.id,
        title: 'New Level 2 Escalation Received 🏛️',
        message: `Complaint ${complaint.complaintReference} (${complaint.category}) at ${complaint.address} has escalated to Level 2. Higher Authority review required.`,
        type: 'OFFICER_ESCALATION_ALERT',
      });

      results.escalatedToLevel2 += 1;
      results.escalatedIds.push(complaint.id);
    } else if (currentLevel === 2) {
      const nextDeadline = calculateResolutionDeadline(3, now);

      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: complaint.id },
          data: {
            escalationLevel: 3,
            status: 'ESCALATED',
            resolutionDeadline: nextDeadline,
            escalatedAt: now,
          },
        });

        await tx.escalationEvent.create({
          data: {
            complaintId: complaint.id,
            fromLevel: 2,
            toLevel: 3,
            reason: 'Second resolution deadline exceeded without resolution at Higher Municipal Authority level.',
            actionTaken: 'Automated Escalation to Level 3 (District Collector Office / COLLECTOR_OFFICE)',
            notes: 'Critical automated escalation to District Collectorate oversight.',
            actionById: systemActorId,
          },
        });

        if (systemActorId) {
          await tx.complaintStatusHistory.create({
            data: {
              complaintId: complaint.id,
              oldStatus: complaint.status,
              newStatus: 'ESCALATED',
              changedById: systemActorId,
              notes: 'Automatically escalated to Level 3 (District Collector Office) for critical administrative intervention.',
            },
          });
        }
      });

      // Send In-App Notifications
      await createNotification({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        title: 'CRITICAL: Complaint Escalated to District Collector Office 🚨',
        message: `Your complaint ${complaint.complaintReference} has reached Level 3 (District Collector Office) for highest-level administrative intervention.`,
        type: 'COMPLAINT_ESCALATED_L3',
      });

      await notifyCollectorOffice({
        complaintId: complaint.id,
        title: 'CRITICAL ESCALATION: District Collector Office Alert 🏛️',
        message: `Critical Escalation: Complaint ${complaint.complaintReference} (${complaint.category}) at ${complaint.address} is unresolved after 48 hours. Collectorate directives required.`,
        type: 'COLLECTOR_CRITICAL_ALERT',
      });

      await notifyMunicipalOfficers({
        complaintId: complaint.id,
        title: 'Escalated to District Collector Office ⚠️',
        message: `Complaint ${complaint.complaintReference} has breached Level 2 deadline and is now under District Collector Office review.`,
        type: 'OFFICER_CRITICAL_ALERT',
      });

      results.escalatedToLevel3 += 1;
      results.escalatedIds.push(complaint.id);
    }
  }

  return results;
};

/**
 * Reassigns an escalated complaint to a new worker.
 * Recorded in both Complaint and EscalationEvent audit logs.
 */
export const reassignEscalatedComplaint = async ({ complaintId, workerId, notes, actionById, officerRole }) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  if (!complaint) {
    throw new Error('Complaint not found.');
  }

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: { user: true },
  });
  if (!worker) {
    throw new Error('Worker record not found.');
  }

  const actionRoleLabel = officerRole === 'COLLECTOR_OFFICE' ? 'District Collector Office' : 'Higher Municipal Officer';

  const updated = await prisma.$transaction(async (tx) => {
    const updatedComplaint = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        assignedWorkerId: workerId,
        status: 'ASSIGNED',
        officerNotes: notes ? `Reassigned by ${actionRoleLabel}: ${notes}` : `Reassigned by ${actionRoleLabel}`,
      },
      include: {
        citizen: true,
        assignedWorker: { include: { user: true } },
        serviceZone: true,
      },
    });

    await tx.escalationEvent.create({
      data: {
        complaintId,
        fromLevel: complaint.escalationLevel,
        toLevel: complaint.escalationLevel,
        reason: `Reassignment by ${actionRoleLabel}`,
        actionTaken: `Reassigned to worker ${worker.user.fullName} (${worker.employeeCode})`,
        notes: notes || 'Sanitation personnel reassigned by authority.',
        actionById,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: 'ASSIGNED',
        changedById: actionById,
        notes: `Reassigned to worker ${worker.user.fullName} (${worker.employeeCode}) by ${actionRoleLabel}. ${notes || ''}`,
      },
    });

    return updatedComplaint;
  });

  // Notify citizen and worker
  await createNotification({
    userId: complaint.citizenId,
    complaintId,
    title: 'Worker Reassigned by Municipal Authority',
    message: `Your complaint ${complaint.complaintReference} was reassigned to worker ${worker.user.fullName} by ${actionRoleLabel}.`,
    type: 'WORKER_REASSIGNED',
  });

  await createNotification({
    userId: worker.userId,
    complaintId,
    title: 'Priority Task Reassigned to You',
    message: `Escalated complaint ${complaint.complaintReference} has been reassigned to you by ${actionRoleLabel}. Immediate action required.`,
    type: 'TASK_ASSIGNED',
  });

  return updated;
};

/**
 * Updates priority of an escalated complaint.
 */
export const prioritizeEscalatedComplaint = async ({ complaintId, priority, notes, actionById, officerRole }) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  if (!complaint) {
    throw new Error('Complaint not found.');
  }

  const actionRoleLabel = officerRole === 'COLLECTOR_OFFICE' ? 'District Collector Office' : 'Higher Municipal Officer';

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        priority,
        officerNotes: notes ? `Priority updated to ${priority} by ${actionRoleLabel}: ${notes}` : `Priority elevated to ${priority} by ${actionRoleLabel}`,
      },
    });

    await tx.escalationEvent.create({
      data: {
        complaintId,
        fromLevel: complaint.escalationLevel,
        toLevel: complaint.escalationLevel,
        reason: `Priority adjusted by ${actionRoleLabel}`,
        actionTaken: `Priority updated to ${priority}`,
        notes: notes || `Priority set to ${priority}`,
        actionById,
      },
    });

    return res;
  });

  await notifyAdmins({
    complaintId,
    title: `Priority Updated: ${priority}`,
    message: `Complaint ${complaint.complaintReference} priority was set to ${priority} by ${actionRoleLabel}.`,
    type: 'PRIORITY_UPDATED',
  });

  return updated;
};

/**
 * Records official instructions/directives from the District Collector Office.
 */
export const recordCollectorInstructions = async ({
  complaintId,
  instructions,
  assignedWorkerId,
  priority,
  notes,
  actionById,
}) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { assignedWorker: { include: { user: true } } },
  });
  if (!complaint) {
    throw new Error('Complaint not found.');
  }

  const updateData = {
    collectorInstructions: instructions,
    officerNotes: notes || instructions,
  };

  if (priority) {
    updateData.priority = priority;
  }

  if (assignedWorkerId) {
    updateData.assignedWorkerId = assignedWorkerId;
    updateData.status = 'ASSIGNED';
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        citizen: true,
        assignedWorker: { include: { user: true } },
      },
    });

    await tx.escalationEvent.create({
      data: {
        complaintId,
        fromLevel: complaint.escalationLevel,
        toLevel: complaint.escalationLevel,
        reason: 'District Collector Office Directive Recorded',
        actionTaken: 'Collector Instructions Issued',
        notes: `Collector Directive: "${instructions}". ${notes || ''}`,
        actionById,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: updateData.status || complaint.status,
        changedById: actionById,
        notes: `District Collector Office instructions issued: "${instructions}"`,
      },
    });

    return res;
  });

  // Notify all stakeholders
  await createNotification({
    userId: complaint.citizenId,
    complaintId,
    title: 'District Collector Directives Issued 🏛️',
    message: `Official directives from the District Collector Office have been recorded for your complaint ${complaint.complaintReference}.`,
    type: 'COLLECTOR_DIRECTIVE_CITIZEN',
  });

  await notifyMunicipalOfficers({
    complaintId,
    title: 'Collectorate Directive Issued ⚠️',
    message: `District Collector Office issued instructions for ${complaint.complaintReference}: "${instructions}". Compliance required immediately.`,
    type: 'COLLECTOR_DIRECTIVE_OFFICER',
  });

  if (updated.assignedWorker?.user?.id) {
    await createNotification({
      userId: updated.assignedWorker.user.id,
      complaintId,
      title: 'Collector Directive on Assigned Task 📢',
      message: `District Collector instructions on complaint ${complaint.complaintReference}: "${instructions}".`,
      type: 'COLLECTOR_DIRECTIVE_WORKER',
    });
  }

  return updated;
};

/**
 * Resolves an escalated complaint directly by Higher Authority or Collector Office.
 * Stops automatic escalation permanently.
 */
export const resolveEscalatedComplaint = async ({ complaintId, notes, actionById, officerRole }) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });
  if (!complaint) {
    throw new Error('Complaint not found.');
  }

  const actionRoleLabel = officerRole === 'COLLECTOR_OFFICE' ? 'District Collector Office' : 'Higher Municipal Officer';
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'RESOLVED',
        completedAt: now,
        officerNotes: notes ? `Resolved by ${actionRoleLabel}: ${notes}` : `Resolved directly by ${actionRoleLabel}`,
      },
      include: {
        citizen: true,
        assignedWorker: { include: { user: true } },
      },
    });

    await tx.escalationEvent.create({
      data: {
        complaintId,
        fromLevel: complaint.escalationLevel,
        toLevel: complaint.escalationLevel,
        reason: `Direct Resolution by ${actionRoleLabel}`,
        actionTaken: 'Complaint Resolved and Escalation Stopped',
        notes: notes || `Direct resolution verified and completed by ${actionRoleLabel}.`,
        actionById,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: 'RESOLVED',
        changedById: actionById,
        notes: `Complaint resolved directly by ${actionRoleLabel}. Notes: ${notes || 'Verified resolved.'}`,
      },
    });

    return res;
  });

  // Notify citizen
  await createNotification({
    userId: complaint.citizenId,
    complaintId,
    title: 'Complaint Resolved by Authority 🎉',
    message: `Your complaint ${complaint.complaintReference} has been verified and resolved by the ${actionRoleLabel}. Thank you for your patience!`,
    type: 'COMPLAINT_RESOLVED',
  });

  return updated;
};

/**
 * Starts background scheduler interval suitable for Render web services.
 */
let schedulerIntervalId = null;

export const startEscalationScheduler = () => {
  if (schedulerIntervalId) {
    console.log('[Escalation Scheduler] Already active.');
    return;
  }

  const checkIntervalMs = Number(process.env.ESCALATION_CHECK_INTERVAL_MS) || 60 * 1000; // Check every 60s
  console.log(`[Escalation Scheduler] Starting automatic escalation background runner (every ${checkIntervalMs / 1000}s)...`);

  // Immediate initial check on startup
  setTimeout(async () => {
    try {
      const res = await checkAndEscalateComplaints();
      if (res.escalatedToLevel2 > 0 || res.escalatedToLevel3 > 0) {
        console.log(`[Escalation Scheduler] Startup check: Escalated ${res.escalatedToLevel2} to L2, ${res.escalatedToLevel3} to L3.`);
      }
    } catch (err) {
      console.warn('[Escalation Scheduler] Initial check error:', err.message);
    }
  }, 3000);

  schedulerIntervalId = setInterval(async () => {
    try {
      const res = await checkAndEscalateComplaints();
      if (res.escalatedToLevel2 > 0 || res.escalatedToLevel3 > 0) {
        console.log(`[Escalation Scheduler] Periodic check: Escalated ${res.escalatedToLevel2} to L2, ${res.escalatedToLevel3} to L3.`);
      }
    } catch (err) {
      console.warn('[Escalation Scheduler] Periodic run error:', err.message);
    }
  }, checkIntervalMs);

  return schedulerIntervalId;
};

export const stopEscalationScheduler = () => {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    console.log('[Escalation Scheduler] Stopped.');
  }
};
