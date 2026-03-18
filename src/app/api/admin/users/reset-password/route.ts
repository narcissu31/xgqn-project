import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resetUserPassword } from '@/lib/db';

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
    const { userIds, newPassword } = body;

    if (!userIds || !Array.isArray(userIds) || !newPassword) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 验证密码格式
    if (!validatePassword(newPassword)) {
      return NextResponse.json({ error: '密码至少8位，需包含大写字母、小写字母、数字、符号中至少两种' }, { status: 400 });
    }

    let successCount = 0;
    userIds.forEach((userId: string) => {
      if (resetUserPassword(userId, newPassword)) {
        successCount++;
      }
    });

    if (successCount > 0) {
      return NextResponse.json({ success: true, count: successCount });
    } else {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
  } catch (error) {
    console.error('操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
