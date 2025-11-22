import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const data = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const updateData: any = {
      title: data.title,
      description: data.description || null,
      category: data.category,
      priority: data.priority,
      status: data.status,
      isAllDay: data.isAllDay !== undefined ? data.isAllDay : false,
      order: data.order,
    };

    // projectId の処理
    if (data.projectId) {
      updateData.project = {
        connect: { id: data.projectId },
      };
    } else if (data.projectId === null) {
      updateData.project = {
        disconnect: true,
      };
    }

    // startDate の処理（ISO-8601形式に変換）
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate).toISOString();
    } else if (data.startDate === null) {
      updateData.startDate = null;
    }

    // dueDate の処理（ISO-8601形式に変換）
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate).toISOString();
    } else if (data.dueDate === null) {
      updateData.dueDate = null;
    }

    // 完了状態が変更された場合
    if (data.completed !== undefined) {
      updateData.completed = data.completed;
      updateData.completedAt = data.completed ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          include: {
            client: true,
          },
        },
        subTasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // サブタスクも一緒に削除される（Cascade設定済み）
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
