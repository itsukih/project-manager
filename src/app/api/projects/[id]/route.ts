import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMonths, endOfMonth } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const data = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const updateData: any = {
      name: data.name,
      description: data.description || null,
      clientId: data.clientId,
      salesStatus: data.salesStatus,
      progressStatus: data.progressStatus,
      consultationDate: data.consultationDate ? new Date(data.consultationDate) : null,
      orderDate: data.orderDate ? new Date(data.orderDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      firstDraftDate: data.firstDraftDate ? new Date(data.firstDraftDate) : null,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      hasOutsourcing: data.hasOutsourcing || false,
      outsourcingPartnerSheetUrl: data.outsourcingPartnerSheetUrl || null,
      clientSheetUrl: data.clientSheetUrl || null,
      amount: data.amount || 0,
      outsourcingCost: data.outsourcingCost || 0,
      invoiceIssued: data.invoiceIssued || false,
      paymentConfirmed: data.paymentConfirmed || false,
    };

    if (data.invoiceIssued && !data.paymentDueDate) {
      const invoiceDate = data.orderDate ? new Date(data.orderDate) : new Date();
      updateData.paymentDueDate = endOfMonth(addMonths(invoiceDate, 1));
    } else if (data.paymentDueDate) {
      updateData.paymentDueDate = new Date(data.paymentDueDate);
    } else if (!data.invoiceIssued) {
      updateData.paymentDueDate = null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
      },
    });

    // パートナー関係を更新
    if (data.outsourcingPartnerIds !== undefined) {
      // 既存の関係を削除
      await prisma.projectOutsourcingPartner.deleteMany({
        where: { projectId: id },
      });

      // 新しい関係を作成
      if (data.outsourcingPartnerIds.length > 0) {
        await prisma.projectOutsourcingPartner.createMany({
          data: data.outsourcingPartnerIds.map((partnerId: number) => ({
            projectId: id,
            outsourcingPartnerId: partnerId,
          })),
        });
      }
    }

    // 更新されたプロジェクトを取得
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}