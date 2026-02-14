import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 請求書更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = parseInt(resolvedParams.invoiceId);
    const data = await request.json();

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const invoice = await prisma.projectInvoice.update({
      where: { id: invoiceId },
      data: {
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

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// 請求書削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = parseInt(resolvedParams.invoiceId);

    if (isNaN(invoiceId)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    await prisma.projectInvoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
