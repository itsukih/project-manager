import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 特定案件の工程一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    const phases = await prisma.projectPhase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error('Failed to fetch project phases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project phases' },
      { status: 500 }
    );
  }
}

// 特定案件に工程を追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();

    const phase = await prisma.projectPhase.create({
      data: {
        projectId,
        type: body.type,
        name: body.name,
        startDate: body.startDate ? new Date(body.startDate) : null,
        firstDraftDate: body.firstDraftDate ? new Date(body.firstDraftDate) : null,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        status: body.status || 'NOT_STARTED',
        notes: body.notes || null,
      },
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error('Failed to create project phase:', error);
    return NextResponse.json(
      { error: 'Failed to create project phase' },
      { status: 500 }
    );
  }
}
