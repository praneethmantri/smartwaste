import prisma from '../config/db.js';
import { generateComplaintsCsv, generateComplaintsPdfStream } from '../services/reportService.js';

export const getStatistics = async (req, res, next) => {
  try {
    const [
      totalComplaints,
      newComplaints,
      assignedComplaints,
      inProgressComplaints,
      completedComplaints,
      rejectedComplaints,
      reopenedComplaints,
      totalCitizens,
      activeWorkers,
      completedRecords,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
      prisma.complaint.count({ where: { status: 'ASSIGNED' } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: 'COMPLETED' } }),
      prisma.complaint.count({ where: { status: 'REJECTED' } }),
      prisma.complaint.count({ where: { status: 'REOPENED' } }),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.worker.count({ where: { availabilityStatus: { in: ['AVAILABLE', 'ON_DUTY'] } } }),
      prisma.complaint.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { not: null },
        },
        select: { createdAt: true, completedAt: true },
      }),
    ]);

    // Calculate Average Resolution Time in hours
    let averageResolutionHours = 0;
    if (completedRecords.length > 0) {
      const totalDiffMs = completedRecords.reduce((acc, curr) => {
        const diff = Math.abs(new Date(curr.completedAt).getTime() - new Date(curr.createdAt).getTime());
        return acc + diff;
      }, 0);
      averageResolutionHours = Number((totalDiffMs / (completedRecords.length * 3600 * 1000)).toFixed(1));
    }

    res.json({
      success: true,
      data: {
        totalComplaints,
        newComplaints,
        pendingComplaints: assignedComplaints,
        inProgressComplaints,
        completedComplaints,
        rejectedComplaints,
        reopenedComplaints,
        registeredCitizens: totalCitizens,
        activeWorkers,
        averageResolutionHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Complaints by Category
    const categoryGroup = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    const byCategory = categoryGroup.map((c) => ({
      name: c.category,
      count: c._count.id,
    }));

    // 2. Complaints by Status
    const statusGroup = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const byStatus = statusGroup.map((s) => ({
      name: s.status,
      count: s._count.id,
    }));

    // 3. Zone-wise complaints
    const zones = await prisma.serviceZone.findMany({
      include: {
        _count: {
          select: { complaints: true },
        },
      },
    });
    const byZone = zones.map((z) => ({
      name: z.name.split(' - ')[0],
      fullName: z.name,
      count: z._count.complaints,
    }));

    // 4. Worker Task Completion
    const workers = await prisma.worker.findMany({
      include: {
        user: { select: { fullName: true } },
        _count: {
          select: {
            assignedComplaints: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });
    const workerPerformance = workers.map((w) => ({
      name: w.user.fullName.split(' ')[0],
      fullName: w.user.fullName,
      code: w.employeeCode,
      completed: w._count.assignedComplaints,
    }));

    // 5. Monthly trend (past 6 months)
    const allComplaints = await prisma.complaint.findMany({
      select: { createdAt: true },
    });

    const monthMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed recent months
    const currentMonthIndex = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIndex - i + 12) % 12;
      monthMap[months[mIdx]] = 0;
    }

    allComplaints.forEach((c) => {
      const mName = months[new Date(c.createdAt).getMonth()];
      if (monthMap[mName] !== undefined) {
        monthMap[mName] += 1;
      }
    });

    const monthlyTrends = Object.keys(monthMap).map((m) => ({
      month: m,
      complaints: monthMap[m],
    }));

    res.json({
      success: true,
      data: {
        byCategory,
        byStatus,
        byZone,
        workerPerformance,
        monthlyTrends,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        state: true,
        address: true,
        createdAt: true,
        worker: {
          include: {
            serviceZone: true,
            _count: {
              select: { assignedComplaints: true },
            },
          },
        },
        _count: {
          select: {
            complaints: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const exportComplaintsCsv = async (req, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: true,
        assignedWorker: { include: { user: true } },
        serviceZone: true,
      },
    });

    const csvData = generateComplaintsCsv(complaints);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=smartwaste-complaints-${Date.now()}.csv`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

export const exportComplaintsPdf = async (req, res, next) => {
  try {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        citizen: true,
        assignedWorker: { include: { user: true } },
        serviceZone: true,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=smartwaste-report-${Date.now()}.pdf`);

    generateComplaintsPdfStream(complaints, res);
  } catch (error) {
    next(error);
  }
};
