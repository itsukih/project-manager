import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name.trim(),
        homepageUrl: data.homepageUrl,
        contactPerson: data.contactPerson,
        status: data.status,
        rank: data.rank,
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
        salesTextUpdated: data.salesTextUpdated,
        salesTextUpdatedMonth: data.salesTextUpdatedMonth,
        regularContact: data.regularContact,
        regularContactMonth: data.regularContactMonth,
        lastContact: data.lastContact ? new Date(data.lastContact) : null,
        contractPdfPath: data.contractPdfPath,
        contractPdfName: data.contractPdfName,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    // 関連する案件も一緒に削除（カスケード削除）
    await prisma.project.deleteMany({
      where: { clientId: id },
    });

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}