import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectById, updateProject, deleteProductMaterials } from '@/lib/db';

// DELETE /api/projects/[id]/products/[productId] - 删除产品及其材料
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id, productId } = await params;

  try {
    const project = getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 从项目选择列表中移除产品
    const newSelectedProducts = (project.selectedProducts || []).filter(
      (pId: string) => pId !== productId
    );
    
    // 更新项目
    updateProject(id, { selectedProducts: newSelectedProducts });
    
    // 删除产品关联的材料
    deleteProductMaterials(id, productId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除产品失败:', error);
    return NextResponse.json({ error: '删除产品失败' }, { status: 500 });
  }
}
