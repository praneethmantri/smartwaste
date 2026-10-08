import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning existing records ---');
  await prisma.feedback.deleteMany();
  await prisma.completionProof.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.collectionSchedule.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.serviceZone.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Seeding Service Zones ---');
  const zoneNorth = await prisma.serviceZone.create({
    data: {
      name: 'North Zone - Ward 1 (Gandhi Nagar)',
      description: 'Covers residential colonies, schools, and local markets in northern sector.',
    },
  });

  const zoneCentral = await prisma.serviceZone.create({
    data: {
      name: 'Central Zone - Ward 2 (Clock Tower & Market)',
      description: 'High-density commercial hubs, central bus terminal, and vegetable markets.',
    },
  });

  const zoneSouth = await prisma.serviceZone.create({
    data: {
      name: 'South Zone - Ward 3 (Green Valley & Lake View)',
      description: 'Suburban residential zone with parks, hospitals, and lakeside walkway.',
    },
  });

  const zoneEast = await prisma.serviceZone.create({
    data: {
      name: 'East Zone - Ward 4 (Industrial & Bypass)',
      description: 'Workshops, warehouse zone, and peri-urban rural connector roads.',
    },
  });

  console.log('--- Seeding Users ---');
  const adminPasswordHash = await bcrypt.hash('AdminPassword@123', 10);
  const workerPasswordHash = await bcrypt.hash('WorkerPassword@123', 10);
  const citizenPasswordHash = await bcrypt.hash('CitizenPassword@123', 10);

  // 1. Administrator
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Dr. Ashok Varma (Sanitation Commissioner)',
      email: 'admin@smartwaste.gov',
      passwordHash: adminPasswordHash,
      phone: '+91 98480 12345',
      role: 'ADMIN',
      address: 'Municipal Corporation HQ, Civil Lines',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530001',
    },
  });

  // 2. Three Workers
  const workerUser1 = await prisma.user.create({
    data: {
      fullName: 'Ramesh Kumar (Sanitation Officer)',
      email: 'ramesh.worker@smartwaste.gov',
      passwordHash: workerPasswordHash,
      phone: '+91 98480 22331',
      role: 'WORKER',
      address: 'Staff Quarters Block A, Gandhi Nagar',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530002',
    },
  });

  const worker1 = await prisma.worker.create({
    data: {
      userId: workerUser1.id,
      employeeCode: 'SW-EMP-001',
      serviceZoneId: zoneNorth.id,
      availabilityStatus: 'ON_DUTY',
    },
  });

  const workerUser2 = await prisma.user.create({
    data: {
      fullName: 'Suresh Reddy (Waste Truck Driver)',
      email: 'suresh.worker@smartwaste.gov',
      passwordHash: workerPasswordHash,
      phone: '+91 98480 22332',
      role: 'WORKER',
      address: 'Sector 4, Market Colony',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530003',
    },
  });

  const worker2 = await prisma.worker.create({
    data: {
      userId: workerUser2.id,
      employeeCode: 'SW-EMP-002',
      serviceZoneId: zoneCentral.id,
      availabilityStatus: 'AVAILABLE',
    },
  });

  const workerUser3 = await prisma.user.create({
    data: {
      fullName: 'Anita Sharma (Area Supervisor)',
      email: 'anita.worker@smartwaste.gov',
      passwordHash: workerPasswordHash,
      phone: '+91 98480 22333',
      role: 'WORKER',
      address: 'Plot 14, Green Valley Enclave',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530004',
    },
  });

  const worker3 = await prisma.worker.create({
    data: {
      userId: workerUser3.id,
      employeeCode: 'SW-EMP-003',
      serviceZoneId: zoneSouth.id,
      availabilityStatus: 'ON_DUTY',
    },
  });

  // 3. Five Citizens
  const citizen1 = await prisma.user.create({
    data: {
      fullName: 'Rahul Verma',
      email: 'rahul.citizen@example.com',
      passwordHash: citizenPasswordHash,
      phone: '+91 91234 56701',
      role: 'CITIZEN',
      address: 'House No 12-4, Gandhi Nagar Road',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530002',
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      fullName: 'Priya Patel',
      email: 'priya.citizen@example.com',
      passwordHash: citizenPasswordHash,
      phone: '+91 91234 56702',
      role: 'CITIZEN',
      address: 'Flat 302, Sai Residency, Clock Tower',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530003',
    },
  });

  const citizen3 = await prisma.user.create({
    data: {
      fullName: 'Vikram Rao',
      email: 'vikram.citizen@example.com',
      passwordHash: citizenPasswordHash,
      phone: '+91 91234 56703',
      role: 'CITIZEN',
      address: 'Villa 8, Green Valley Phase 1',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530004',
    },
  });

  const citizen4 = await prisma.user.create({
    data: {
      fullName: 'Sunita Devi',
      email: 'sunita.citizen@example.com',
      passwordHash: citizenPasswordHash,
      phone: '+91 91234 56704',
      role: 'CITIZEN',
      address: '24/1, Industrial Bypass Lane',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530005',
    },
  });

  const citizen5 = await prisma.user.create({
    data: {
      fullName: 'Manoj Kumar',
      email: 'manoj.citizen@example.com',
      passwordHash: citizenPasswordHash,
      phone: '+91 91234 56705',
      role: 'CITIZEN',
      address: '55, Vivekananda Nagar',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      pincode: '530002',
    },
  });

  console.log('--- Seeding Collection Schedules ---');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  await prisma.collectionSchedule.createMany({
    data: [
      {
        serviceZoneId: zoneNorth.id,
        workerId: worker1.id,
        collectionDate: today,
        collectionTime: '06:30 AM - 08:30 AM',
        wasteType: 'Wet waste & Organic',
        vehicleNumber: 'AP-31-TC-4011',
        status: 'IN_PROGRESS',
      },
      {
        serviceZoneId: zoneCentral.id,
        workerId: worker2.id,
        collectionDate: today,
        collectionTime: '08:45 AM - 10:45 AM',
        wasteType: 'Dry waste & Cardboard',
        vehicleNumber: 'AP-31-TC-4012',
        status: 'SCHEDULED',
      },
      {
        serviceZoneId: zoneSouth.id,
        workerId: worker3.id,
        collectionDate: tomorrow,
        collectionTime: '07:00 AM - 09:00 AM',
        wasteType: 'Plastic & Recyclables',
        vehicleNumber: 'AP-31-TC-4015',
        status: 'SCHEDULED',
      },
      {
        serviceZoneId: zoneEast.id,
        collectionDate: dayAfter,
        collectionTime: '10:00 AM - 12:00 PM',
        wasteType: 'E-waste & Bulk items',
        vehicleNumber: 'AP-31-TC-4020',
        status: 'SCHEDULED',
      },
    ],
  });

  console.log('--- Seeding Complaints ---');
  // Complaint 1: Completed with proof & feedback
  const c1 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0001',
      citizenId: citizen1.id,
      wasteType: 'Wet waste',
      category: 'Garbage not collected',
      description: 'Morning door-to-door organic waste collection was missed for entire street 3.',
      priority: 'HIGH',
      latitude: 17.7215,
      longitude: 83.2985,
      address: 'Street 3, Gandhi Nagar, near Community Hall',
      imageUrl: '/uploads/sample_garbage_1.jpg',
      status: 'COMPLETED',
      assignedWorkerId: worker1.id,
      serviceZoneId: zoneNorth.id,
      completedAt: new Date(Date.now() - 3600 * 1000 * 4),
    },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: c1.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizen1.id,
        notes: 'Citizen registered complaint with GPS coordinates.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 24),
      },
      {
        complaintId: c1.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'ASSIGNED',
        changedById: adminUser.id,
        notes: 'Assigned to Ward 1 sanitation worker Ramesh Kumar.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 12),
      },
      {
        complaintId: c1.id,
        oldStatus: 'ASSIGNED',
        newStatus: 'IN_PROGRESS',
        changedById: workerUser1.id,
        notes: 'Worker reached spot with collection vehicle AP-31-TC-4011.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 6),
      },
      {
        complaintId: c1.id,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'COMPLETED',
        changedById: workerUser1.id,
        notes: 'Waste collected and street cleaned. Verification proof uploaded.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 4),
      },
    ],
  });

  await prisma.completionProof.create({
    data: {
      complaintId: c1.id,
      workerId: worker1.id,
      imageUrl: '/uploads/sample_proof_1.jpg',
      notes: 'Cleared 45kg wet waste bin and sanitized neighborhood drop point.',
    },
  });

  await prisma.feedback.create({
    data: {
      userId: citizen1.id,
      complaintId: c1.id,
      rating: 5,
      recommendation: true,
      comments: 'Prompt response! The street was thoroughly cleaned and worker was polite.',
    },
  });

  // Complaint 2: In Progress
  const c2 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0002',
      citizenId: citizen2.id,
      wasteType: 'Plastic waste',
      category: 'Overflowing dustbin',
      description: 'Public community bin overflowing with single-use plastic cups and packaging.',
      priority: 'HIGH',
      latitude: 17.7289,
      longitude: 83.3051,
      address: 'Clock Tower Junction, Bus Stop 4',
      imageUrl: '/uploads/sample_garbage_2.jpg',
      status: 'IN_PROGRESS',
      assignedWorkerId: worker2.id,
      serviceZoneId: zoneCentral.id,
    },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: c2.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizen2.id,
        notes: 'Complaint logged via citizen mobile app.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 18),
      },
      {
        complaintId: c2.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'ASSIGNED',
        changedById: adminUser.id,
        notes: 'Assigned to Suresh Reddy.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 8),
      },
      {
        complaintId: c2.id,
        oldStatus: 'ASSIGNED',
        newStatus: 'IN_PROGRESS',
        changedById: workerUser2.id,
        notes: 'Dispatched secondary vehicle for bulk plastic clearance.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 2),
      },
    ],
  });

  // Complaint 3: Assigned
  const c3 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0003',
      citizenId: citizen3.id,
      wasteType: 'Mixed waste',
      category: 'Illegal dumping',
      description: 'Commercial debris and unsegregated household garbage dumped in vacant plot 19.',
      priority: 'HIGH',
      latitude: 17.7121,
      longitude: 83.3214,
      address: 'Plot 19, Green Valley Lakeside Avenue',
      imageUrl: '/uploads/sample_garbage_3.jpg',
      status: 'ASSIGNED',
      assignedWorkerId: worker3.id,
      serviceZoneId: zoneSouth.id,
    },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: c3.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizen3.id,
        notes: 'Illegal dumping photo captured with GPS.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 10),
      },
      {
        complaintId: c3.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'ASSIGNED',
        changedById: adminUser.id,
        notes: 'Forwarded to Anita Sharma for inspection and clearance.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 3),
      },
    ],
  });

  // Complaint 4: Submitted (Fresh)
  const c4 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0004',
      citizenId: citizen4.id,
      wasteType: 'Blocked drainage',
      category: 'Blocked drainage',
      description: 'Solid plastic bottles and silt clogging storm drain, causing foul water stagnation.',
      priority: 'EMERGENCY',
      latitude: 17.7342,
      longitude: 83.2871,
      address: 'Near Old Railway Bridge, Industrial Bypass',
      imageUrl: '/uploads/sample_garbage_4.jpg',
      status: 'SUBMITTED',
      serviceZoneId: zoneEast.id,
    },
  });

  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: c4.id,
      oldStatus: null,
      newStatus: 'SUBMITTED',
      changedById: citizen4.id,
      notes: 'Emergency priority complaint created by citizen.',
      changedAt: new Date(Date.now() - 3600 * 1000 * 1),
    },
  });

  // Complaint 5: Rejected (Duplicate / Invalid)
  const c5 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0005',
      citizenId: citizen5.id,
      wasteType: 'Other',
      category: 'Public sanitation issue',
      description: 'Private construction sand pile on roadside.',
      priority: 'LOW',
      latitude: 17.7231,
      longitude: 83.2954,
      address: 'Lane 2, Vivekananda Nagar',
      imageUrl: '/uploads/sample_garbage_5.jpg',
      status: 'REJECTED',
      serviceZoneId: zoneNorth.id,
    },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: c5.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizen5.id,
        notes: 'Submitted by citizen.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 30),
      },
      {
        complaintId: c5.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'REJECTED',
        changedById: adminUser.id,
        notes: 'Private building construction material; falls under private contractor purview, not municipal waste.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 20),
      },
    ],
  });

  // Complaint 6: Reopened
  const c6 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0006',
      citizenId: citizen1.id,
      wasteType: 'Dry waste',
      category: 'Overflowing dustbin',
      description: 'Bins at market entrance filled to brim again within 2 hours of morning sweep.',
      priority: 'HIGH',
      latitude: 17.7208,
      longitude: 83.2991,
      address: 'Main Entrance, Gandhi Nagar Vegetable Market',
      imageUrl: '/uploads/sample_garbage_6.jpg',
      status: 'REOPENED',
      assignedWorkerId: worker1.id,
      serviceZoneId: zoneNorth.id,
    },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: c6.id,
        oldStatus: null,
        newStatus: 'SUBMITTED',
        changedById: citizen1.id,
        notes: 'Initial submission.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 48),
      },
      {
        complaintId: c6.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'COMPLETED',
        changedById: workerUser1.id,
        notes: 'First round collected.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 36),
      },
      {
        complaintId: c6.id,
        oldStatus: 'COMPLETED',
        newStatus: 'REOPENED',
        changedById: citizen1.id,
        notes: 'Waste continues to pile up; additional large container needed.',
        changedAt: new Date(Date.now() - 3600 * 1000 * 8),
      },
    ],
  });

  // Complaint 7 to 10
  const c7 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0007',
      citizenId: citizen2.id,
      wasteType: 'E-waste',
      category: 'Other',
      description: 'Discarded computer monitors and cables left near electrical junction box.',
      priority: 'MEDIUM',
      latitude: 17.7265,
      longitude: 83.3032,
      address: 'Behind SBI ATM, Market Road',
      imageUrl: '/uploads/sample_garbage_7.jpg',
      status: 'SUBMITTED',
      serviceZoneId: zoneCentral.id,
    },
  });

  const c8 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0008',
      citizenId: citizen3.id,
      wasteType: 'Plastic waste',
      category: 'Garbage not collected',
      description: 'Segregated blue plastic bin not cleared since two days.',
      priority: 'MEDIUM',
      latitude: 17.7145,
      longitude: 83.3189,
      address: 'Row 3, Lake View Enclave',
      imageUrl: '/uploads/sample_garbage_8.jpg',
      status: 'ASSIGNED',
      assignedWorkerId: worker3.id,
      serviceZoneId: zoneSouth.id,
    },
  });

  const c9 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0009',
      citizenId: citizen4.id,
      wasteType: 'Mixed waste',
      category: 'Illegal dumping',
      description: 'Poultry waste and rotten vegetable sacks dumped overnight near canal bridge.',
      priority: 'EMERGENCY',
      latitude: 17.7311,
      longitude: 83.2899,
      address: 'Canal Crossing, Industrial Ring Road',
      imageUrl: '/uploads/sample_garbage_9.jpg',
      status: 'IN_PROGRESS',
      assignedWorkerId: worker2.id,
      serviceZoneId: zoneEast.id,
    },
  });

  const c10 = await prisma.complaint.create({
    data: {
      complaintReference: 'SW-2026-0010',
      citizenId: citizen5.id,
      wasteType: 'Dry waste',
      category: 'Garbage not collected',
      description: 'Garden leaves and cardboard boxes kept for pickup.',
      priority: 'LOW',
      latitude: 17.7248,
      longitude: 83.2967,
      address: 'Park Lane 4, Vivekananda Nagar',
      imageUrl: '/uploads/sample_garbage_10.jpg',
      status: 'COMPLETED',
      assignedWorkerId: worker1.id,
      serviceZoneId: zoneNorth.id,
      completedAt: new Date(Date.now() - 3600 * 1000 * 14),
    },
  });

  await prisma.feedback.create({
    data: {
      userId: citizen5.id,
      complaintId: c10.id,
      rating: 4,
      recommendation: true,
      comments: 'Collected on time. Appreciated the SMS and app update.',
    },
  });

  console.log('--- Seeding In-App Notifications ---');
  await prisma.notification.createMany({
    data: [
      {
        userId: citizen1.id,
        complaintId: c1.id,
        title: 'Complaint Resolved 🎉',
        message: 'Your complaint SW-2026-0001 has been resolved by Ramesh Kumar. Please submit your feedback.',
        isRead: true,
        type: 'COMPLAINT_COMPLETED',
      },
      {
        userId: citizen2.id,
        complaintId: c2.id,
        title: 'Work In Progress 🚜',
        message: 'Worker Suresh Reddy has arrived on site for complaint SW-2026-0002.',
        isRead: false,
        type: 'COMPLAINT_IN_PROGRESS',
      },
      {
        userId: citizen4.id,
        complaintId: c4.id,
        title: 'Complaint Registered 📋',
        message: 'Your emergency complaint SW-2026-0004 has been logged and escalated to the zonal officer.',
        isRead: false,
        type: 'COMPLAINT_SUBMITTED',
      },
      {
        userId: workerUser1.id,
        complaintId: c6.id,
        title: 'Task Reopened ⚠️',
        message: 'Complaint SW-2026-0006 at Market Entrance has been reopened for follow-up cleaning.',
        isRead: false,
        type: 'TASK_REOPENED',
      },
      {
        userId: adminUser.id,
        complaintId: c4.id,
        title: 'New Emergency Alert 🚨',
        message: 'Emergency complaint SW-2026-0004 reported in East Zone. Requires immediate worker allocation.',
        isRead: false,
        type: 'ADMIN_ALERT',
      },
    ],
  });

  console.log('--- Database Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
