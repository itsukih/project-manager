import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const partners = await prisma.outsourcingPartner.findMany({
      orderBy: [
        { type: 'asc' },  // DESIGNER, CODER順
        { name: 'asc' }   // 各種別内であいうえお順
      ],
    });
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Failed to fetch outsourcing partners:', error);
    return NextResponse.json({ error: 'Failed to fetch outsourcing partners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'Outsourcing partner name is required' }, { status: 400 });
    }

    if (!data.type || !['DESIGNER', 'CODER'].includes(data.type)) {
      return NextResponse.json({ error: 'Valid partner type is required' }, { status: 400 });
    }

    const partner = await prisma.outsourcingPartner.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        portfolioUrl: data.portfolioUrl,
        email: data.email,
        notes: data.notes,
        contractPdfPath: data.contractPdfPath,
        contractPdfName: data.contractPdfName,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error('Failed to create outsourcing partner:', error);
    return NextResponse.json({ error: 'Failed to create outsourcing partner' }, { status: 500 });
  }
}