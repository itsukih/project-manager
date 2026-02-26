import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

interface BulkUpdateItem {
  id: string | number;
  consultationDate?: string | null;
  orderDate?: string | null;
  startDate?: string | null;
  firstDraftDate?: string | null;
  deliveryDate?: string | null;
}

export async function PATCH(request: NextRequest) {
  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map(async (update: BulkUpdateItem) => {
        const { id, ...data } = update;

        const updateData: Prisma.ProjectUpdateInput = {};

        if (data.consultationDate !== undefined) {
          updateData.consultationDate = data.consultationDate ? new Date(data.consultationDate) : null;
        }
        if (data.orderDate !== undefined) {
          updateData.orderDate = data.orderDate ? new Date(data.orderDate) : null;
        }
        if (data.startDate !== undefined) {
          updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        }
        if (data.firstDraftDate !== undefined) {
          updateData.firstDraftDate = data.firstDraftDate ? new Date(data.firstDraftDate) : null;
        }
        if (data.deliveryDate !== undefined) {
          updateData.deliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : null;
        }

        return await prisma.project.update({
          where: { id: typeof id === 'string' ? parseInt(id) : id },
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
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to bulk update projects:', error);
    return NextResponse.json({ error: 'Failed to bulk update projects' }, { status: 500 });
  }
}