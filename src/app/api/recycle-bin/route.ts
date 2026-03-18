import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDeletedProjects, restoreProject, permanentlyDeleteProject, softDeleteProject, getAllProjects } from '@/lib/db';

// 获取回收站项目
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    
    let projects = getDeletedProjects();
    
    // 非管理员只能看到自己删除的项目
    if (role !== 'admin') {
      const allProjects = getAllProjects();
      const userProjectIds = allProjects.filter((p: any) => p.userId === userId).map((p: any) => p.id);
      projects = projects.filter((p: any) => userProjectIds.includes(p.id));
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('获取回收站失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 恢复/删除操作
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { action, projectIds } = body;

    if (action === 'restore') {
      // 恢复项目
      if (projectIds && Array.isArray(projectIds)) {
        projectIds.forEach((id: string) => restoreProject(id));
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'permanentDelete') {
      // 彻底删除
      if (projectIds && Array.isArray(projectIds)) {
        projectIds.forEach((id: string) => {
          const project = getDeletedProjects().find((p: any) => p.id === id);
          if (project && (role === 'admin' || project.userId === userId)) {
            permanentlyDeleteProject(id);
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// 将项目移到回收站
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { projectIds } = body;

    if (projectIds && Array.isArray(projectIds)) {
      projectIds.forEach((id: string) => {
        const project = getAllProjects().find((p: any) => p.id === id);
        if (project && (role === 'admin' || project.userId === userId)) {
          softDeleteProject(id);
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效请求' }, { status: 400 });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
