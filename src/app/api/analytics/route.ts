import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Project, Client } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // 受注額の集計（受注日ベース）
    const orderAmountResult = await prisma.project.aggregate({
      where: {
        orderDate: {
          gte: startOfYear,
          lt: endOfYear,
        },
        salesStatus: { not: 'LOST' },
      },
      _sum: {
        amount: true,
        outsourcingCost: true,
      },
    });

    // 納品額の集計（納品日ベース）
    const deliveryAmountResult = await prisma.project.aggregate({
      where: {
        deliveryDate: {
          gte: startOfYear,
          lt: endOfYear,
        },
        salesStatus: 'DELIVERED',
      },
      _sum: {
        amount: true,
        outsourcingCost: true,
      },
    });

    // 月別の受注額
    const monthlyOrderAmount = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const monthStart = new Date(year, index, 1);
        const monthEnd = new Date(year, index + 1, 1);

        const result = await prisma.project.aggregate({
          where: {
            orderDate: {
              gte: monthStart,
              lt: monthEnd,
            },
            salesStatus: { not: 'LOST' },
          },
          _sum: {
            amount: true,
            outsourcingCost: true,
          },
        });

        return {
          month: index + 1,
          amount: result._sum.amount || 0,
          outsourcingCost: result._sum.outsourcingCost || 0,
          profit: (result._sum.amount || 0) - (result._sum.outsourcingCost || 0),
        };
      })
    );

    // 月別の納品額
    const monthlyDeliveryAmount = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const monthStart = new Date(year, index, 1);
        const monthEnd = new Date(year, index + 1, 1);

        const result = await prisma.project.aggregate({
          where: {
            deliveryDate: {
              gte: monthStart,
              lt: monthEnd,
            },
            salesStatus: 'DELIVERED',
          },
          _sum: {
            amount: true,
            outsourcingCost: true,
          },
        });

        return {
          month: index + 1,
          amount: result._sum.amount || 0,
          outsourcingCost: result._sum.outsourcingCost || 0,
          profit: (result._sum.amount || 0) - (result._sum.outsourcingCost || 0),
        };
      })
    );

    // 月別の件数（相談数・受注数・納品数）
    const monthlyCounts = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const monthStart = new Date(year, index, 1);
        const monthEnd = new Date(year, index + 1, 1);

        // 相談数（consultationDateベース）
        const consultationCount = await prisma.project.count({
          where: {
            consultationDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
        });

        // 受注数（orderDateベース）
        const orderCount = await prisma.project.count({
          where: {
            orderDate: {
              gte: monthStart,
              lt: monthEnd,
            },
            salesStatus: { not: 'LOST' },
          },
        });

        // 納品数（deliveryDateベース）
        const deliveryCount = await prisma.project.count({
          where: {
            deliveryDate: {
              gte: monthStart,
              lt: monthEnd,
            },
            salesStatus: 'DELIVERED',
          },
        });

        return {
          month: index + 1,
          consultationCount,
          orderCount,
          deliveryCount,
        };
      })
    );

    // ステータス別の案件数
    const statusCounts = await prisma.project.groupBy({
      by: ['salesStatus'],
      _count: {
        id: true,
      },
      where: {
        salesStatus: { not: 'LOST' },
      },
    });

    // 月別入金予定（deliveryDate の翌月 = 入金月）
    // 対象: 前年12月納品(→当年1月入金) + 当年1〜11月納品(→当年2〜12月入金)
    const paymentForecastStart = new Date(year - 1, 11, 1); // 前年12月1日
    const paymentForecastEnd = new Date(year, 11, 1);       // 当年12月1日（11月末まで）

    const paymentProjects = await prisma.project.findMany({
      where: {
        deliveryDate: {
          gte: paymentForecastStart,
          lt: paymentForecastEnd,
        },
        salesStatus: { not: 'LOST' },
      },
      include: {
        client: true,
      },
    });

    type ProjectWithClient = Project & { client: Client };

    // 1〜12月の入金予定を構築
    const monthlyPaymentForecast = Array.from({ length: 12 }, (_, index) => {
      const paymentMonth = index + 1; // 1〜12

      // 入金月 = 納品月 + 1 なので、納品月 = paymentMonth - 1
      // paymentMonth=1 → 納品月=12(前年), paymentMonth=2 → 納品月=1(当年), ...
      const filtered = paymentProjects.filter((project: ProjectWithClient) => {
        if (!project.deliveryDate) return false;
        const delivery = new Date(project.deliveryDate);
        const deliveryMonth = delivery.getMonth() + 1; // 1-12
        const deliveryYear = delivery.getFullYear();

        // 入金月を計算
        let incomeMonth = deliveryMonth + 1;
        let incomeYear = deliveryYear;
        if (incomeMonth > 12) {
          incomeMonth = 1;
          incomeYear += 1;
        }

        return incomeYear === year && incomeMonth === paymentMonth;
      });

      const income = filtered.reduce((sum: number, p: ProjectWithClient) => sum + (p.amount || 0), 0);
      const expense = filtered.reduce((sum: number, p: ProjectWithClient) => sum + (p.outsourcingCost || 0), 0);

      return {
        month: paymentMonth,
        income,
        expense,
        profit: income - expense,
        projects: filtered.map((p: ProjectWithClient) => ({
          id: p.id,
          name: p.name,
          clientName: p.client.name,
          amount: p.amount || 0,
          outsourcingCost: p.outsourcingCost || 0,
          deliveryDate: p.deliveryDate ? p.deliveryDate.toISOString() : '',
        })),
      };
    });

    return NextResponse.json({
      year,
      totalOrderAmount: orderAmountResult._sum.amount || 0,
      totalOrderOutsourcingCost: orderAmountResult._sum.outsourcingCost || 0,
      totalOrderProfit: (orderAmountResult._sum.amount || 0) - (orderAmountResult._sum.outsourcingCost || 0),
      totalDeliveryAmount: deliveryAmountResult._sum.amount || 0,
      totalDeliveryOutsourcingCost: deliveryAmountResult._sum.outsourcingCost || 0,
      totalDeliveryProfit: (deliveryAmountResult._sum.amount || 0) - (deliveryAmountResult._sum.outsourcingCost || 0),
      monthlyOrderAmount,
      monthlyDeliveryAmount,
      monthlyCounts,
      statusCounts,
      monthlyPaymentForecast,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}