import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'client';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名をサニタイズ
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${type}_invoice_${timestamp}_${sanitizedName}`;

    // アップロードディレクトリの作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'invoices');
    await mkdir(uploadDir, { recursive: true });

    // ファイルの保存
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      pdfPath: `/uploads/invoices/${fileName}`,
      pdfName: file.name,
    });
  } catch (error) {
    console.error('Failed to upload invoice:', error);
    return NextResponse.json({ error: 'Failed to upload invoice' }, { status: 500 });
  }
}
