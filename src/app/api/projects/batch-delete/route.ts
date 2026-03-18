import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProjectById, deleteProjectWithFiles, getAllProjects } from '@/lib/db';

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const body = await request.json().catch(() => ({}));
    const { projectIds } = body;

    // 批量删除
    if (projectIds && Array.isArray(projectIds)) {
      projectIds.forEach((pid: string) => {
        const project = getProjectById(pid);
        if (project && (role === 'admin' || project.userId === userId)) {
          deleteProjectWithFiles(pid);
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效请求' }, { status: 400 });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
