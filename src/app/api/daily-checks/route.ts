import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const targetDate = new Date(dateStr + 'T00:00:00.000Z');
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // LOST除外、入金確認済み除外
    const projects = await prisma.project.findMany({
      where: {
        salesStatus: { not: 'LOST' },
        paymentConfirmed: false,
      },
      include: {
        client: true,
        projectPartners: {
          include: { outsourcingPartner: true },
        },
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { salesStatus: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 当日のチェック状態
    const checks = await prisma.dailyCheck.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    // 7日以内の期限タスク（未完了のみ）
    const upcomingTasks = await prisma.task.findMany({
      where: {
        completed: false,
        dueDate: {
          gte: dayStart,
          lte: addDays(dayStart, 7),
        },
      },
      include: {
        project: { include: { client: true } },
      },
      orderBy: [
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json({ projects, checks, upcomingTasks });
  } catch (error) {
    console.error('Daily checks API error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily checks', detail: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const targetDate = new Date(data.date + 'T00:00:00.000Z');

    const check = await prisma.dailyCheck.upsert({
      where: {
        projectId_date: {
          projectId: data.projectId,
          date: targetDate,
        },
      },
      create: {
        projectId: data.projectId,
        date: targetDate,
        note: data.note || null,
      },
      update: {
        note: data.note || null,
      },
    });

    return NextResponse.json(check, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create daily check' }, { status: 500 });
  }
}
