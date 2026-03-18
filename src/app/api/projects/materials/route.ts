import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrCreateMaterial } from '@/lib/db';

// POST /api/projects/materials - 创建或获取材料
export async function POST(
  request: Request
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, materialName, materialGroup, productionLineId, isProjectMaterial } = body;

    if (!projectId || !materialName || !materialGroup) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const material = getOrCreateMaterial(projectId, materialName, materialGroup, productionLineId, isProjectMaterial);
    
    return NextResponse.json(material);
  } catch (error) {
    console.error('创建材料失败:', error);
    return NextResponse.json({ error: '创建材料失败' }, { status: 500 });
  }
}
