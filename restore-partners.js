const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function restore() {
  try {
    const data = JSON.parse(fs.readFileSync('./partner-data.json', 'utf8'));

    console.log('Restoring data:', data);

    for (const item of data) {
      await prisma.projectOutsourcingPartner.create({
        data: {
          projectId: item.projectId,
          outsourcingPartnerId: item.partnerId,
        },
      });
      console.log(`Restored: Project ${item.projectId} <-> Partner ${item.partnerId}`);
    }

    console.log('Restoration complete!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Restoration failed:', error);
    await prisma.$disconnect();
  }
}

restore();
