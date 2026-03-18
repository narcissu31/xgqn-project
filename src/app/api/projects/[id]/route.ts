import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getProjectById, 
  getMaterialsByProjectId, 
  updateProject as dbUpdateProject,
  deleteProjectWithFiles, 
  softDeleteProject,
  batchCreateProjectMaterials,
  deleteProductMaterials
} from '@/lib/db';
import { PROJECT_MATERIALS } from '@/lib/materials';

// GET /api/projects/[id] - 获取项目详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  // 获取项目材料，如果没有则创建
  let materials = await getMaterialsByProjectId(id);
  
  // 检查是否有项目材料，如果没有则创建
  const hasProjectMaterials = materials.some((m: any) => m.isProjectMaterial);
  if (!hasProjectMaterials) {
    await batchCreateProjectMaterials(id, PROJECT_MATERIALS.map(p => p.name));
    materials = await getMaterialsByProjectId(id);
  }

  return NextResponse.json({
    project,
    materials
  });
}

// PUT /api/projects/[id] - 更新项目信息
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const body = await request.json();
    const { projectName, projectManager, projectNumber, selectedProducts } = body;

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 只能修改自己的项目
    if (project.userId !== userId) {
      return NextResponse.json({ error: '无权修改此项目' }, { status: 403 });
    }

    const updated = dbUpdateProject(id, { 
      projectName, 
      projectManager, 
      projectNumber,
      selectedProducts 
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('更新失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - 彻底删除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (role !== 'admin' && project.userId !== userId) {
      return NextResponse.json({ error: '无权删除此项目' }, { status: 403 });
    }

    await deleteProjectWithFiles(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

// PATCH /api/projects/[id] - 软删除（移到回收站）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await params;

  try {
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: '无权删除此项目' }, { status: 403 });
    }

    await softDeleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('软删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
