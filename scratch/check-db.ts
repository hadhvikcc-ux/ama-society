import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../packages/api/.env') });

const { PrismaClient } = require(path.join(__dirname, '../packages/api/node_modules/@prisma/client'));

const prisma = new PrismaClient();

async function main() {
  const socCount = await prisma.society.count();
  const userCount = await prisma.user.count();
  const flatCount = await prisma.flat.count();
  console.log(`Societies: ${socCount}, Users: ${userCount}, Flats: ${flatCount}`);

  const societies = await prisma.society.findMany({ take: 5 });
  console.log('Sample societies:', JSON.stringify(societies, null, 2));

  const users = await prisma.user.findMany({ take: 5, select: { id: true, email: true, phone: true, role: true, name: true } });
  console.log('Sample users:', JSON.stringify(users, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
