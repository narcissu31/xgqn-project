import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMaterialById, updateMaterial } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 判断是否为图片
function isImage(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
  return !!ext;
}

// 上传单个文件
async function saveFile(file: File): Promise<string> {
  const ext = path.extname(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  
  return `/uploads/${filename}`;
}

// POST - 上传文件（图片或文件）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const materialId = formData.get('materialId') as string;
  const file = formData.get('file') as File;

  if (!materialId || !file) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  // 检查材料是否存在
  const material = getMaterialById(materialId);
  if (!material) {
    return NextResponse.json({ error: '材料不存在' }, { status: 404 });
  }

  try {
    // 保存文件
    const filePath = await saveFile(file);
    
    // 根据文件类型添加到对应列表
    const isImg = isImage(file.name);
    
    if (isImg) {
      const newImages = [...(material.images || []), filePath];
      const updated = updateMaterial(materialId, { images: newImages });
      return NextResponse.json(updated);
    } else {
      const newFiles = [...(material.files || []), filePath];
      const updated = updateMaterial(materialId, { files: newFiles });
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

// DELETE - 删除文件（图片或文件）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const { materialId, type, index } = await request.json();

  try {
    const material = getMaterialById(materialId);
    if (!material) {
      return NextResponse.json({ error: '材料不存在' }, { status: 404 });
    }

    // 根据类型删除
    if (type === 'image') {
      const imagePath = material.images?.[index];
      if (imagePath) {
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      const newImages = (material.images || []).filter((_: any, i: number) => i !== index);
      const updated = updateMaterial(materialId, { images: newImages });
      return NextResponse.json(updated);
    } else if (type === 'file') {
      const filePath = material.files?.[index];
      if (filePath) {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      const newFiles = (material.files || []).filter((_: any, i: number) => i !== index);
      const updated = updateMaterial(materialId, { files: newFiles });
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ error: '无效的文件类型' }, { status: 400 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
