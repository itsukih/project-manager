import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ファイル名をサニタイズ
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;

    // バッファに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // public/uploads/templates に保存
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates');
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // 公開URLパス
    const publicPath = `/uploads/templates/${fileName}`;

    return NextResponse.json({
      pdfPath: publicPath,
      pdfName: file.name,
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
