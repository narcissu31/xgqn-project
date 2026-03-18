import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { batchCreateProductMaterials } from '@/lib/db';

// POST /api/projects/[id]/materials/batch - 批量创建产品材料
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { productionLineId, productId, materialNames } = body;

    if (!productionLineId || !productId || !materialNames) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    batchCreateProductMaterials(id, productionLineId, productId, materialNames);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('批量创建材料失败:', error);
    return NextResponse.json({ error: '批量创建材料失败' }, { status: 500 });
  }
}
