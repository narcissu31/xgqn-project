import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, createUser } from '@/lib/db';
import bcrypt from 'bcryptjs';

// 验证用户名格式：仅小写字母，或小写字母加数字
function validateUsername(username: string): boolean {
  return /^[a-z][a-z0-9]*$/.test(username);
}

// 验证密码：至少8位，大写字母、小写字母、数字、符号至少包含两种
function validatePassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const count = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  return count >= 2;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  try {
    const users = getAllUsers();
    // 返回用户列表，包含deletedAt字段
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      deletedAt: u.deletedAt || null
    }));
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

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
    const { username, password, role: userRole } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    // 验证用户名格式
    if (!validateUsername(username)) {
      return NextResponse.json({ error: '用户名仅支持小写字母，或小写字母加数字组合' }, { status: 400 });
    }

    // 验证密码格式
    if (!validatePassword(password)) {
      return NextResponse.json({ error: '密码至少8位，需包含大写字母、小写字母、数字、符号中至少两种' }, { status: 400 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = createUser(username, hashedPassword, userRole || 'user');
    
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error: any) {
    if (error.message === '用户名已存在') {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

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

    const currentUserId = (session.user as any).id;
    if (userIds.includes(currentUserId)) {
      return NextResponse.json({ error: '不能操作当前登录用户' }, { status: 400 });
    }

    // 软删除用户
    const { softDeleteUser } = require('@/lib/db');
    userIds.forEach((id: string) => softDeleteUser(id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
