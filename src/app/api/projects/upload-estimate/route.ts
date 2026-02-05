import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'client' or 'outsourcing'

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    if (!type || !['client', 'outsourcing'].includes(type)) {
      return NextResponse.json({ error: '見積りタイプが不正です' }, { status: 400 });
    }

    // ファイル名をサニタイズ
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${type}_estimate_${timestamp}_${originalName}`;

    // アップロードディレクトリを作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'estimates');
    await mkdir(uploadDir, { recursive: true });

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 公開URLパスを返す
    const pdfPath = `/uploads/estimates/${fileName}`;

    return NextResponse.json({
      pdfPath,
      pdfName: file.name,
    });
  } catch (error) {
    console.error('Failed to upload estimate:', error);
    return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 });
  }
}
