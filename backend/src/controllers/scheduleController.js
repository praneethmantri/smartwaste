import prisma from '../config/db.js';
import { createScheduleSchema, updateScheduleSchema } from '../validators/schemas.js';

export const getServiceZones = async (req, res, next) => {
  try {
    const zones = await prisma.serviceZone.findMany({
      include: {
        _count: {
          select: {
            workers: true,
            complaints: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchedules = async (req, res, next) => {
  try {
    const { serviceZoneId, date } = req.query;

    const where = {};
    if (serviceZoneId) {
      where.serviceZoneId = serviceZoneId;
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.collectionDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const schedules = await prisma.collectionSchedule.findMany({
      where,
      orderBy: { collectionDate: 'asc' },
      include: {
        serviceZone: true,
        worker: {
          include: {
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

export const createSchedule = async (req, res, next) => {
  try {
    const data = createScheduleSchema.parse(req.body);

    const schedule = await prisma.collectionSchedule.create({
      data: {
        serviceZoneId: data.serviceZoneId,
        workerId: data.workerId || null,
        collectionDate: new Date(data.collectionDate),
        collectionTime: data.collectionTime,
        wasteType: data.wasteType,
        vehicleNumber: data.vehicleNumber || null,
        status: 'SCHEDULED',
      },
      include: {
        serviceZone: true,
        worker: {
          include: { user: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Collection schedule created successfully.',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateScheduleSchema.parse(req.body);

    const updatePayload = {};
    if (data.serviceZoneId) updatePayload.serviceZoneId = data.serviceZoneId;
    if (data.workerId !== undefined) updatePayload.workerId = data.workerId;
    if (data.collectionDate) updatePayload.collectionDate = new Date(data.collectionDate);
    if (data.collectionTime) updatePayload.collectionTime = data.collectionTime;
    if (data.wasteType) updatePayload.wasteType = data.wasteType;
    if (data.vehicleNumber !== undefined) updatePayload.vehicleNumber = data.vehicleNumber;
    if (data.status) updatePayload.status = data.status;

    const schedule = await prisma.collectionSchedule.update({
      where: { id },
      data: updatePayload,
      include: {
        serviceZone: true,
        worker: {
          include: { user: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Collection schedule updated successfully.',
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.collectionSchedule.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Collection schedule cancelled and removed.',
    });
  } catch (error) {
    next(error);
  }
};
