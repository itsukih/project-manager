import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 請求書一覧取得
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

    const invoices = await prisma.projectInvoice.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// 請求書追加
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

    const invoice = await prisma.projectInvoice.create({
      data: {
        projectId,
        type: data.type,
        description: data.description || null,
        amount: data.amount || 0,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        url: data.url || null,
        pdfPath: data.pdfPath || null,
        pdfName: data.pdfName || null,
        status: data.status || 'DRAFT',
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
