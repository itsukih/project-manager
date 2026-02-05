import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 見積り一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const estimates = await prisma.projectEstimate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(estimates);
  } catch (error) {
    console.error('Failed to fetch estimates:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

// 見積り追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.id);
    const data = await request.json();

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const estimate = await prisma.projectEstimate.create({
      data: {
        projectId,
        type: data.type,
        description: data.description || null,
        url: data.url || null,
        pdfPath: data.pdfPath || null,
        pdfName: data.pdfName || null,
      },
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('Failed to create estimate:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
