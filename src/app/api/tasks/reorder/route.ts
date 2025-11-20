import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { taskOrders } = await request.json();

    // トランザクションで一括更新
    await prisma.$transaction(
      taskOrders.map((item: { id: number; order: number }) =>
        prisma.task.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
