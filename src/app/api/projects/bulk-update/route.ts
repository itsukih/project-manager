import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const { updates } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map(async (update: any) => {
        const { id, ...data } = update;

        const updateData: any = {};

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
          where: { id: parseInt(id) },
          data: updateData,
          include: {
            client: true,
            outsourcingPartner: true,
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