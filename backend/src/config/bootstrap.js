import bcrypt from 'bcryptjs';
import prisma from './db.js';

/**
 * Non-destructive, idempotent bootstrap for initial Administrator, Worker, and Service Zones.
 * Guarantees that essential system roles exist without deleting or altering existing citizens or complaints.
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

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
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
    } else if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log(`✓ Existing user updated to ADMIN role: ${adminEmail}`);
    }

    // 3. Ensure Sanitation Worker exists
    const workerEmail = process.env.WORKER_EMAIL || 'ramesh.worker@smartwaste.gov';
    const workerPassword = process.env.WORKER_PASSWORD || 'WorkerPassword@123';
    const workerName = process.env.WORKER_NAME || 'Ramesh Kumar (Sanitation Officer)';
    const employeeCode = process.env.WORKER_EMP_CODE || 'SW-EMP-001';

    let workerUser = await prisma.user.findUnique({
      where: { email: workerEmail },
      include: { worker: true },
    });

    if (!workerUser) {
      const workerHash = await bcrypt.hash(workerPassword, 10);
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
    } else if (workerUser.role !== 'WORKER') {
      workerUser = await prisma.user.update({
        where: { id: workerUser.id },
        data: { role: 'WORKER' },
        include: { worker: true },
      });
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

    console.log('✓ Initial Administrator and Worker provisioning check complete.');
  } catch (error) {
    console.error('Warning: Error during initial accounts bootstrap:', error.message);
  }
};
