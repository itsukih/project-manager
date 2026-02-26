import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where: Prisma.RegularContactHistoryWhereInput = {};

    if (templateId) {
      where.templateId = parseInt(templateId);
    }
    if (year) {
      where.year = parseInt(year);
    }
    if (month) {
      where.month = parseInt(month);
    }

    const histories = await prisma.regularContactHistory.findMany({
      where,
      include: {
        template: {
          select: {
            title: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(histories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch histories' }, { status: 500 });
  }
}