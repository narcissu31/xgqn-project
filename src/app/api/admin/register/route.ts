import { NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/db';
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    // 验证用户名格式
    if (!validateUsername(username)) {
      return NextResponse.json({ error: '用户名仅支持小写字母，或小写字母加数字组合' }, { status: 400 });
    }

    // 验证密码格式
    if (!validatePassword(password)) {
      return NextResponse.json({ error: '密码至少8位，需包含大写字母、小写字母、数字、符号中至少两种' }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 创建管理员账户
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await createUser(username, hashedPassword, 'admin');

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
