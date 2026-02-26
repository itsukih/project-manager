import { NextRequest, NextResponse } from 'next/server';
import { Prisma, SalesStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { addMonths, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const salesStatus = searchParams.get('salesStatus');
    const orderMonth = searchParams.get('orderMonth');
    const consultationMonth = searchParams.get('consultationMonth');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeLost = searchParams.get('includeLost') === 'true';

    const where: Prisma.ProjectWhereInput = {};

    if (!includeLost) {
      where.salesStatus = { not: 'LOST' };
    }

    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    if (salesStatus) {
      where.salesStatus = salesStatus as SalesStatus;
    }

    if (orderMonth) {
      const date = new Date(orderMonth);
      where.orderDate = {
        gte: new Date(date.getFullYear(), date.getMonth(), 1),
        lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      };
    }

    if (consultationMonth) {
      const date = new Date(consultationMonth);
      where.consultationDate = {
        gte: new Date(date.getFullYear(), date.getMonth(), 1),
        lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      };
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {};
    (orderBy as Record<string, string>)[sortBy] = sortOrder;

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
        phases: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        estimates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const createData: Prisma.ProjectUncheckedCreateInput = {
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
      outsourcingInvoiceReceived: data.outsourcingInvoiceReceived || false,
      outsourcingPaymentMade: data.outsourcingPaymentMade || false,
      outsourcingPaymentDate: data.outsourcingPaymentDate ? new Date(data.outsourcingPaymentDate) : null,
      clientSheetUrl: data.clientSheetUrl || null,
      amount: data.amount || 0,
      outsourcingCost: data.outsourcingCost || 0,
      invoiceIssued: data.invoiceIssued || false,
      paymentConfirmed: data.paymentConfirmed || false,
    };

    if (data.invoiceIssued && !data.paymentDueDate) {
      const invoiceDate = data.orderDate ? new Date(data.orderDate) : new Date();
      createData.paymentDueDate = endOfMonth(addMonths(invoiceDate, 1));
    } else if (data.paymentDueDate) {
      createData.paymentDueDate = new Date(data.paymentDueDate);
    }

    const project = await prisma.project.create({
      data: createData,
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
      },
    });

    // パートナー関係を作成
    if (data.partnerData && data.partnerData.length > 0) {
      // partnerData形式: [{ partnerId, invoiceReceived, paymentMade, paymentDate }]
      await prisma.projectOutsourcingPartner.createMany({
        data: data.partnerData.map((pd: { partnerId: number; invoiceReceived: boolean; paymentMade: boolean; paymentDate?: string }) => ({
          projectId: project.id,
          outsourcingPartnerId: pd.partnerId,
          invoiceReceived: pd.invoiceReceived || false,
          paymentMade: pd.paymentMade || false,
          paymentDate: pd.paymentDate ? new Date(pd.paymentDate) : null,
        })),
      });
    } else if (data.outsourcingPartnerIds && data.outsourcingPartnerIds.length > 0) {
      // 後方互換性のため、従来形式もサポート
      await prisma.projectOutsourcingPartner.createMany({
        data: data.outsourcingPartnerIds.map((partnerId: number) => ({
          projectId: project.id,
          outsourcingPartnerId: partnerId,
        })),
      });
    }

    // 更新されたプロジェクトを取得
    const updatedProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        client: true,
        projectPartners: {
          include: {
            outsourcingPartner: true,
          },
        },
        estimates: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json(updatedProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}