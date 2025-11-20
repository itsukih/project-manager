import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid outsourcing partner ID' }, { status: 400 });
    }

    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'Outsourcing partner name is required' }, { status: 400 });
    }

    if (!data.type || !['DESIGNER', 'CODER'].includes(data.type)) {
      return NextResponse.json({ error: 'Valid partner type is required' }, { status: 400 });
    }

    const partner = await prisma.outsourcingPartner.update({
      where: { id },
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

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Failed to update outsourcing partner:', error);
    return NextResponse.json({ error: 'Failed to update outsourcing partner' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid outsourcing partner ID' }, { status: 400 });
    }

    const projectsCount = await prisma.projectOutsourcingPartner.count({
      where: { outsourcingPartnerId: id },
    });

    if (projectsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete outsourcing partner with existing projects' },
        { status: 400 }
      );
    }

    await prisma.outsourcingPartner.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Outsourcing partner deleted successfully' });
  } catch (error) {
    console.error('Failed to delete outsourcing partner:', error);
    return NextResponse.json({ error: 'Failed to delete outsourcing partner' }, { status: 500 });
  }
}