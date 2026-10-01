import { PrismaClient, UserRole, TenancyType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Safe to re-run: every record is looked up first and only created when missing.
const SOCIETY_CODE = 'AMA-001';

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Society
  const society = await prisma.society.upsert({
    where: { code: SOCIETY_CODE },
    update: {},
    create: {
      code: SOCIETY_CODE,
      name: 'AMA Grand Estate',
      address: '123 Prime Avenue',
      city: 'Metropolis',
      state: 'State',
      pincode: '123456',
      totalFlats: 100,
    },
  });
  console.log(`✅ Society: ${society.name} — code ${society.code}`);

  // 2. Flats
  const flat = async (tower: string, flatNumber: string, floor: number, tenancyType: TenancyType) =>
    (await prisma.flat.findFirst({ where: { societyId: society.id, tower, flatNumber } })) ??
    prisma.flat.create({ data: { societyId: society.id, tower, flatNumber, floor, tenancyType } });
  const flat1 = await flat('A', '101', 1, TenancyType.OWNER);
  await flat('B', '201', 2, TenancyType.TENANT);
  console.log(`✅ Flats: A-101, B-201`);

  // 3. Users (existing users keep their current password)
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = (email: string, name: string, phone: string, role: UserRole, flatId?: string) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, phone, passwordHash, role, societyId: society.id, flatId },
    });
  await user('admin@ama.com', 'Admin User', '1234567890', UserRole.ADMIN);
  await user('resident@ama.com', 'Resident User', '0987654321', UserRole.RESIDENT, flat1.id);
  await user('guard@ama.com', 'Gate Guard', '1122334455', UserRole.GUARD);
  const secretary = await user('secretary@ama.com', 'Society Secretary', '1234500000', UserRole.ADMIN);
  console.log(`✅ Users: admin@ama.com, secretary@ama.com, resident@ama.com, guard@ama.com (password123 for new ones)`);

  // Committee offices: admin@ama.com is President (approves role changes), the second admin is Secretary.
  if (!(await prisma.user.findFirst({ where: { societyId: society.id, committeePosition: 'PRESIDENT' } }))) {
    await prisma.user.update({ where: { email: 'admin@ama.com' }, data: { committeePosition: 'PRESIDENT' } });
  }
  if (!secretary.committeePosition) {
    await prisma.user.update({ where: { id: secretary.id }, data: { committeePosition: 'SECRETARY' } });
  }
  console.log(`✅ President: admin@ama.com • Secretary: secretary@ama.com`);

  // 4. Charge template
  if (!(await prisma.chargeTemplate.findFirst({ where: { societyId: society.id, name: 'Monthly Maintenance' } }))) {
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
  }
  console.log(`✅ Charge template: Monthly Maintenance`);

  // 5. Facility
  if (!(await prisma.facility.findFirst({ where: { societyId: society.id, name: 'Clubhouse' } }))) {
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
  }
  console.log(`✅ Facility: Clubhouse`);

  console.log(`🎉 Seeding finished. Residents sign up with society code ${society.code}.`);
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
