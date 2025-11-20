import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name: data.name.trim(),
        homepageUrl: data.homepageUrl,
        contactPerson: data.contactPerson,
        status: data.status || '未接触',
        rank: data.rank || 'C',
        history: data.history,
        salesIdea: data.salesIdea,
        needs: data.needs,
        approach: data.approach,
        messageToClient: data.messageToClient,
        firstContact: data.firstContact ? new Date(data.firstContact) : null,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
        contractDate: data.contractDate ? new Date(data.contractDate) : null,
        contactType: data.contactType,
        email: data.email,
        notes: data.notes,
        salesText: data.salesText,
        salesTextUpdated: data.salesTextUpdated || false,
        salesTextUpdatedMonth: data.salesTextUpdatedMonth,
        regularContact: data.regularContact || false,
        regularContactMonth: data.regularContactMonth,
        lastContact: data.lastContact ? new Date(data.lastContact) : null,
        contractPdfPath: data.contractPdfPath,
        contractPdfName: data.contractPdfName,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}