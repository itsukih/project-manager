import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    const where: any = {
      parentId: null, // メインタスクのみ取得（サブタスクは除く）
    };

    if (category) {
      where.category = category;
    }

    // 完了後24時間以上経過したタスクを除外
    if (!includeCompleted) {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      where.OR = [
        { completed: false },
        {
          AND: [
            { completed: true },
            { completedAt: { gte: oneDayAgo } }
          ]
        }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
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

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 最大の order 値を取得して +1
    const maxOrder = await prisma.task.findFirst({
      where: { parentId: data.parentId || null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const taskData: any = {
      title: data.title,
      description: data.description || null,
      category: data.category,
      priority: data.priority,
      status: data.status || 'PENDING',
      isAllDay: data.isAllDay || false,
      order: maxOrder ? maxOrder.order + 1 : 0,
    };

    // startDate の処理（ISO-8601形式に変換）
    if (data.startDate) {
      taskData.startDate = new Date(data.startDate).toISOString();
    }

    // dueDate の処理（ISO-8601形式に変換）
    if (data.dueDate) {
      taskData.dueDate = new Date(data.dueDate).toISOString();
    }

    // projectId がある場合のみ追加
    if (data.projectId) {
      taskData.project = {
        connect: { id: data.projectId },
      };
    }

    // parentId がある場合のみ追加
    if (data.parentId) {
      taskData.parent = {
        connect: { id: data.parentId },
      };
    }

    // サブタスクがある場合のみ追加
    if (data.subTasks && data.subTasks.length > 0) {
      taskData.subTasks = {
        create: data.subTasks.map((st: any, index: number) => {
          const subTaskData: any = {
            title: st.title,
            description: null,
            category: data.category,
            priority: data.priority,
            status: data.status || 'PENDING',
            completed: st.completed || false,
            order: index,
          };
          // サブタスクにもprojectIdがある場合
          if (data.projectId) {
            subTaskData.project = {
              connect: { id: data.projectId },
            };
          }
          return subTaskData;
        }),
      };
    }

    const task = await prisma.task.create({
      data: taskData,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
