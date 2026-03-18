import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createProject, getProjectsByUserId, getAllProjects, updateProject, batchCreateProductMaterials, batchCreateProjectMaterials } from '@/lib/db';
import { getBaixiaoProducts, PRODUCTION_LINES, PROJECT_MATERIALS, isBaixiaoTemplate } from '@/lib/materials';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const projects = role === 'admin' ? await getAllProjects() : await getProjectsByUserId(userId);
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: '获取项目失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { projectName, projectManager, projectNumber, template } = await request.json();

  if (!projectName || !projectManager || !projectNumber) {
    return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
  }

  try {
    const project = await createProject({
      projectName,
      projectManager,
      projectNumber,
      userId,
      template: template || 'general'
    });

    // 如果是百校模板，自动添加固定产品
    if (isBaixiaoTemplate(template)) {
      const products = getBaixiaoProducts(template);
      
      // 更新项目的 selectedProducts
      await updateProject(project.id, { selectedProducts: products });
      
      // 为每个产品创建材料记录
      for (const productId of products) {
        // 找到产品所属的产线
        for (const line of PRODUCTION_LINES) {
          const product = line.products.find(p => p.id === productId);
          if (product) {
            await batchCreateProductMaterials(
              project.id,
              line.id,
              productId,
              product.materials.map(m => m.name)
            );
            break;
          }
        }
      }
    }

    // 创建项目材料（第二部分）
    await batchCreateProjectMaterials(project.id, PROJECT_MATERIALS.map(p => p.name));

    return NextResponse.json(project);
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}
