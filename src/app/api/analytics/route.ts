import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}