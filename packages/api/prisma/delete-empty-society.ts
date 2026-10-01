/**
 * Deletes a society that nobody uses (e.g. a duplicate left by an old seed run),
 * together with its empty setup data (flats, charge templates, facilities).
 *
 * Refuses if the society has any users, invoices, payments, tickets, visitors,
 * bookings, orders or other activity. Runs as one transaction: all or nothing.
 *
 *   npx ts-node prisma/delete-empty-society.ts AMA-002          # dry run: shows what would go
 *   npx ts-node prisma/delete-empty-society.ts AMA-002 --yes    # actually delete
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const code = (process.argv[2] ?? '').trim().toUpperCase();
  const confirmed = process.argv.includes('--yes');
  if (!code) throw new Error('Usage: npx ts-node prisma/delete-empty-society.ts <SOCIETY-CODE> [--yes]');

  const society = await prisma.society.findUnique({
    where: { code },
    include: {
      _count: {
        select: {
          users: true, invoices: true, ledgerEntries: true, eventPools: true, chatChannels: true,
          tags: true, VisitorSession: true, GatePassToken: true, ServiceTicket: true,
          FacilityBooking: true, Product: true, Order: true,
          flats: true, chargeTemplates: true, facilities: true,
        },
      },
    },
  });
  if (!society) throw new Error(`No society with code ${code}.`);

  const { flats, chargeTemplates, facilities, ...activity } = society._count;
  const householdLedgers = await prisma.householdLedger.count({ where: { flat: { societyId: society.id } } });
  const inUse = Object.entries({ ...activity, householdLedgers }).filter(([, n]) => n > 0);

  console.log(`Society ${society.code}: ${society.name} (${society.id})`);
  console.log(`  Setup data to delete: ${flats} flats, ${chargeTemplates} charge templates, ${facilities} facilities`);
  if (inUse.length) {
    console.log(`  In use — NOT deleting: ${inUse.map(([k, n]) => `${n} ${k}`).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('  No users or activity.');

  if (!confirmed) {
    console.log(`Dry run only. To delete, run again with --yes.`);
    return;
  }

  await prisma.$transaction([
    prisma.chargeTemplate.deleteMany({ where: { societyId: society.id } }),
    prisma.facility.deleteMany({ where: { societyId: society.id } }),
    prisma.flat.deleteMany({ where: { societyId: society.id } }),
    prisma.society.delete({ where: { id: society.id } }),
  ]);
  console.log(`✅ Deleted society ${society.code} and its ${flats} flats, ${chargeTemplates} charge templates, ${facilities} facilities.`);
}

main()
  .catch((e) => {
    console.error(`❌ ${e.message ?? e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
