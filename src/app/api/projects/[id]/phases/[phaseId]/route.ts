import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 工程の詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { phaseId } = await params;
    const phase = await prisma.projectPhase.findUnique({
      where: { id: parseInt(phaseId) },
    });

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    return NextResponse.json(phase);
  } catch (error) {
    console.error('Failed to fetch phase:', error);
    return NextResponse.json({ error: 'Failed to fetch phase' }, { status: 500 });
  }
}

// 工程を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { phaseId } = await params;
    const body = await request.json();

    const phase = await prisma.projectPhase.update({
      where: { id: parseInt(phaseId) },
      data: {
        type: body.type,
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : null,
        firstDraftDate: body.firstDraftDate ? new Date(body.firstDraftDate) : null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json(phase);
  } catch (error) {
    console.error('Failed to update phase:', error);
    return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 });
  }
}

// 工程を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { phaseId } = await params;
    await prisma.projectPhase.delete({
      where: { id: parseInt(phaseId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete phase:', error);
    return NextResponse.json({ error: 'Failed to delete phase' }, { status: 500 });
  }
}
