import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 見積り更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const resolvedParams = await params;
    const estimateId = parseInt(resolvedParams.estimateId);
    const data = await request.json();

    if (isNaN(estimateId)) {
      return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
    }

    const estimate = await prisma.projectEstimate.update({
      where: { id: estimateId },
      data: {
        type: data.type,
        description: data.description || null,
        url: data.url || null,
        pdfPath: data.pdfPath || null,
        pdfName: data.pdfName || null,
      },
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Failed to update estimate:', error);
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}

// 見積り削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const resolvedParams = await params;
    const estimateId = parseInt(resolvedParams.estimateId);

    if (isNaN(estimateId)) {
      return NextResponse.json({ error: 'Invalid estimate ID' }, { status: 400 });
    }

    await prisma.projectEstimate.delete({
      where: { id: estimateId },
    });

    return NextResponse.json({ message: 'Estimate deleted successfully' });
  } catch (error) {
    console.error('Failed to delete estimate:', error);
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 });
  }
}
