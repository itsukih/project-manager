import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      select: {
        name: true,
        homepageUrl: true,
        contactPerson: true,
        status: true,
        rank: true,
        email: true,
      },
      orderBy: {
        rank: 'asc',
      },
    });

    const csvHeader = '会社名,ホームページURL,担当者,状況,ランク,メールアドレス\n';
    const csvData = clients
      .map(client => `"${client.name}","${client.homepageUrl || ''}","${client.contactPerson || ''}","${client.status}","${client.rank}","${client.email || ''}"`)
      .join('\n');

    const csv = csvHeader + csvData;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="clients.csv"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export clients' }, { status: 500 });
  }
}
