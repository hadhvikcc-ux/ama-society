import { PrismaClient, UserRole, TenancyType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Society
  const society = await prisma.society.create({
    data: {
      name: 'AMA Grand Estate',
      address: '123 Prime Avenue',
      city: 'Metropolis',
      state: 'State',
      pincode: '123456',
      totalFlats: 100,
    },
  });
  console.log(`✅ Society created: ${society.name} (${society.id})`);

  // 2. Create Flats
  const flat1 = await prisma.flat.create({
    data: {
      societyId: society.id,
      tower: 'A',
      flatNumber: '101',
      floor: 1,
      tenancyType: TenancyType.OWNER,
    },
  });
  const flat2 = await prisma.flat.create({
    data: {
      societyId: society.id,
      tower: 'B',
      flatNumber: '201',
      floor: 2,
      tenancyType: TenancyType.TENANT,
    },
  });
  console.log(`✅ Flats created: A-101, B-201`);

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@ama.com',
      phone: '1234567890',
      passwordHash,
      role: UserRole.ADMIN,
      societyId: society.id,
    },
  });

  const resident = await prisma.user.create({
    data: {
      name: 'Resident User',
      email: 'resident@ama.com',
      phone: '0987654321',
      passwordHash,
      role: UserRole.RESIDENT,
      societyId: society.id,
      flatId: flat1.id,
    },
  });

  const guard = await prisma.user.create({
    data: {
      name: 'Gate Guard',
      email: 'guard@ama.com',
      phone: '1122334455',
      passwordHash,
      role: UserRole.GUARD,
      societyId: society.id,
    },
  });

  console.log(`✅ Users created: Admin, Resident, Guard (Password for all: password123)`);

  // 4. Create some Charge Templates
  await prisma.chargeTemplate.create({
    data: {
      societyId: society.id,
      name: 'Monthly Maintenance',
      description: 'Standard monthly maintenance charge',
      amount: 5000,
      cycle: 'MONTHLY',
      appliesTo: 'OWNER',
    },
  });
  console.log(`✅ Charge Templates created`);

  // 5. Create some default Facilities
  await prisma.facility.create({
    data: {
      societyId: society.id,
      name: 'Clubhouse',
      description: 'Main clubhouse for events',
      residentRatePerHour: 500,
      externalRatePerHour: 1500,
      maxCapacity: 100,
    },
  });
  console.log(`✅ Facilities created`);

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
