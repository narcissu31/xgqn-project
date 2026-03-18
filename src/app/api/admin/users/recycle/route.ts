import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, restoreUser, permanentlyDeleteUser } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 });
    }

    const currentUserId = (session.user as any).id;
    if (userIds.includes(currentUserId)) {
      return NextResponse.json({ error: '不能操作当前登录用户' }, { status: 400 });
    }

    if (action === 'restore') {
      for (const id of userIds) {
        await restoreUser(id);
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'permanentDelete') {
      for (const id of userIds) {
        await permanentlyDeleteUser(id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
