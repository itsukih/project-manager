const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    // 既存のproject-partner関係を取得
    const projects = await prisma.$queryRaw`
      SELECT id, outsourcingPartnerId
      FROM projects
      WHERE outsourcingPartnerId IS NOT NULL
    `;

    console.log('Found projects with partners:', projects);

    // データを保存
    const data = projects.map(p => ({
      projectId: p.id,
      partnerId: p.outsourcingPartnerId
    }));

    console.log('Data to migrate:', data);

    await prisma.$disconnect();

    // データをファイルに保存
    const fs = require('fs');
    fs.writeFileSync(
      './partner-data.json',
      JSON.stringify(data, null, 2)
    );

    console.log('Saved to partner-data.json');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
