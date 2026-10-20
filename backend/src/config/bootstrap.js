import bcrypt from 'bcryptjs';
import prisma from './db.js';

/**
 * Non-destructive, idempotent bootstrap for initial Administrator, Worker, Service Zones,
 * Municipal Officer, Collector Office, and Citizen accounts.
 * Guarantees that essential system roles exist without deleting or altering existing citizen complaints.
 */
export const bootstrapInitialAccounts = async () => {
  try {
    // 1. Ensure Service Zones exist
    let defaultZone = await prisma.serviceZone.findFirst();
    if (!defaultZone) {
      console.log('Seeding initial municipal service zones...');
      defaultZone = await prisma.serviceZone.create({
        data: {
          name: 'North Zone - Ward 1 (Gandhi Nagar)',
          description: 'Covers residential colonies, schools, and local markets in northern sector.',
        },
      });
      await prisma.serviceZone.createMany({
        data: [
          {
            name: 'Central Zone - Ward 2 (Clock Tower & Market)',
            description: 'High-density commercial hubs, central bus terminal, and vegetable markets.',
          },
          {
            name: 'South Zone - Ward 3 (Green Valley & Lake View)',
            description: 'Suburban residential zone with parks, hospitals, and lakeside walkway.',
          },
          {
            name: 'East Zone - Ward 4 (Industrial & Bypass)',
            description: 'Workshops, warehouse zone, and peri-urban rural connector roads.',
          },
        ],
        skipDuplicates: true,
      });
      console.log('✓ Municipal service zones provisioned.');
    }

    // 2. Ensure Administrator exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartwaste.gov';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword@123';
    const adminName = process.env.ADMIN_NAME || 'Dr. Ashok Varma (Sanitation Commissioner)';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          fullName: adminName,
          email: adminEmail,
          passwordHash: adminHash,
          phone: '+91 98480 12345',
          role: 'ADMIN',
          address: 'Municipal Corporation HQ, Civil Lines',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530001',
        },
      });
      console.log(`✓ Initial Administrator account provisioned: ${adminEmail}`);
    } else {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN', passwordHash: adminHash },
      });
      console.log(`✓ Administrator password synced: ${adminEmail}`);
    }

    // 3. Ensure Sanitation Worker exists
    const workerEmail = process.env.WORKER_EMAIL || 'ramesh.worker@smartwaste.gov';
    const workerPassword = process.env.WORKER_PASSWORD || 'WorkerPassword@123';
    const workerName = process.env.WORKER_NAME || 'Ramesh Kumar (Sanitation Officer)';
    const employeeCode = process.env.WORKER_EMP_CODE || 'SW-EMP-001';
    const workerHash = await bcrypt.hash(workerPassword, 10);

    let workerUser = await prisma.user.findUnique({
      where: { email: workerEmail },
      include: { worker: true },
    });

    if (!workerUser) {
      workerUser = await prisma.user.create({
        data: {
          fullName: workerName,
          email: workerEmail,
          passwordHash: workerHash,
          phone: '+91 98480 22331',
          role: 'WORKER',
          address: 'Staff Quarters Block A, Gandhi Nagar',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530002',
        },
      });
      console.log(`✓ Initial Worker account provisioned: ${workerEmail}`);
    } else {
      workerUser = await prisma.user.update({
        where: { id: workerUser.id },
        data: { role: 'WORKER', passwordHash: workerHash },
        include: { worker: true },
      });
      console.log(`✓ Worker password synced: ${workerEmail}`);
    }

    // Ensure Worker profile record is linked to workerUser
    const existingWorkerProfile = await prisma.worker.findUnique({
      where: { userId: workerUser.id },
    });

    if (!existingWorkerProfile) {
      await prisma.worker.create({
        data: {
          userId: workerUser.id,
          employeeCode,
          serviceZoneId: defaultZone ? defaultZone.id : null,
          availabilityStatus: 'AVAILABLE',
        },
      });
      console.log(`✓ Worker profile linked: ${employeeCode} (${workerEmail})`);
    }

    // 4. Ensure demo Citizen exists
    const citizenEmail = 'rahul.citizen@example.com';
    const citizenPassword = process.env.CITIZEN_PASSWORD || 'CitizenPassword@123';
    const existingCitizen = await prisma.user.findUnique({
      where: { email: citizenEmail },
    });

    const citizenHash = await bcrypt.hash(citizenPassword, 10);
    if (!existingCitizen) {
      await prisma.user.create({
        data: {
          fullName: 'Rahul Sharma',
          email: citizenEmail,
          passwordHash: citizenHash,
          phone: '+91 98765 43210',
          role: 'CITIZEN',
          address: 'Plot 42, Green Park Avenue',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530017',
        },
      });
      console.log(`✓ Initial Citizen account provisioned: ${citizenEmail}`);
    } else {
      await prisma.user.update({
        where: { id: existingCitizen.id },
        data: { passwordHash: citizenHash },
      });
    }

    // 5. Ensure Municipal Officer (Level 2 Authority) exists
    const officerEmail = process.env.OFFICER_EMAIL || 'officer@smartwaste.gov';
    const officerPassword = process.env.OFFICER_PASSWORD || 'OfficerPassword@123';
    const officerName = process.env.OFFICER_NAME || 'Smt. Lakshmi Devi (Municipal Officer)';

    const existingOfficer = await prisma.user.findUnique({
      where: { email: officerEmail },
    });

    if (!existingOfficer) {
      const officerHash = await bcrypt.hash(officerPassword, 10);
      await prisma.user.create({
        data: {
          fullName: officerName,
          email: officerEmail,
          passwordHash: officerHash,
          phone: '+91 98480 33445',
          role: 'MUNICIPAL_OFFICER',
          address: 'Municipal Corporation Commissionerate, Zone 2',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530002',
        },
      });
      console.log(`✓ Initial Municipal Officer account provisioned: ${officerEmail}`);
    } else if (existingOfficer.role !== 'MUNICIPAL_OFFICER') {
      await prisma.user.update({
        where: { id: existingOfficer.id },
        data: { role: 'MUNICIPAL_OFFICER' },
      });
      console.log(`✓ Existing user updated to MUNICIPAL_OFFICER role: ${officerEmail}`);
    }

    // 6. Ensure Collector Office (Level 3 Authority) exists
    const collectorEmail = process.env.COLLECTOR_EMAIL || 'collector@smartwaste.gov';
    const collectorPassword = process.env.COLLECTOR_PASSWORD || 'CollectorPassword@123';
    const collectorName = process.env.COLLECTOR_NAME || 'Sri K. S. Rao, IAS (District Collector Office)';

    const existingCollector = await prisma.user.findUnique({
      where: { email: collectorEmail },
    });

    if (!existingCollector) {
      const collectorHash = await bcrypt.hash(collectorPassword, 10);
      await prisma.user.create({
        data: {
          fullName: collectorName,
          email: collectorEmail,
          passwordHash: collectorHash,
          phone: '+91 98480 99887',
          role: 'COLLECTOR_OFFICE',
          address: 'District Collectorate, Civil Station',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530001',
        },
      });
      console.log(`✓ Initial Collector Office account provisioned: ${collectorEmail}`);
    } else if (existingCollector.role !== 'COLLECTOR_OFFICE') {
      await prisma.user.update({
        where: { id: existingCollector.id },
        data: { role: 'COLLECTOR_OFFICE' },
      });
      console.log(`✓ Existing user updated to COLLECTOR_OFFICE role: ${collectorEmail}`);
    }

    // 7. Non-destructively initialize resolutionDeadline for legacy complaints without deadlines
    const legacyComplaints = await prisma.complaint.findMany({
      where: { resolutionDeadline: null },
      select: { id: true, createdAt: true },
    });
    if (legacyComplaints.length > 0) {
      const l1Hours = Number(process.env.ESCALATION_L1_INTERVAL_HOURS) || 24;
      for (const c of legacyComplaints) {
        const deadline = new Date(new Date(c.createdAt).getTime() + l1Hours * 3600 * 1000);
        await prisma.complaint.update({
          where: { id: c.id },
          data: { resolutionDeadline: deadline },
        });
      }
      console.log(`✓ Initialized resolution deadlines for ${legacyComplaints.length} existing complaints.`);
    }

    console.log('✓ Initial Administrator, Worker, Citizen, Municipal Officer, and Collector provisioning check complete.');
  } catch (error) {
    console.error('Warning: Error during initial accounts bootstrap:', error.message);
  }
};
