import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const templateId = parseInt(idStr);
    const data = await request.json();
    const { year, month } = data;

    // テンプレートを取得
    const template = await prisma.regularContactTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // 既存の履歴をチェック（年月の重複を防ぐ）
    const existingHistory = await prisma.regularContactHistory.findUnique({
      where: {
        templateId_year_month: {
          templateId,
          year,
          month,
        },
      },
    });

    if (existingHistory) {
      return NextResponse.json(
        { error: `${year}年${month}月の履歴は既に保存されています` },
        { status: 409 }
      );
    }

    // 履歴を保存
    const history = await prisma.regularContactHistory.create({
      data: {
        templateId,
        title: template.title,
        content: template.content,
        year,
        month,
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
  }
}