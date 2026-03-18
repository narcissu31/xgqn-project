import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, deleteUser, softDeleteUser } from '@/lib/db';

// PUT - 软删除用户（移到回收站）
export async function PUT(request: Request) {
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
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 });
    }

    // 不能删除自己
    const currentUserId = (session.user as any).id;
    if (userIds.includes(currentUserId)) {
      return NextResponse.json({ error: '不能删除当前登录用户' }, { status: 400 });
    }

    for (const id of userIds) {
      await softDeleteUser(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// DELETE - 彻底删除用户
export async function DELETE(request: Request) {
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
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 });
    }

    // 不能删除自己
    const currentUserId = (session.user as any).id;
    if (userIds.includes(currentUserId)) {
      return NextResponse.json({ error: '不能删除当前登录用户' }, { status: 400 });
    }

    for (const id of userIds) {
      await deleteUser(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
