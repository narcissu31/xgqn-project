import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 注入 D1 数据库到全局
  const env = (process as any).env;
  if (env.DB && !(globalThis as any).__D1_DB__) {
    (globalThis as any).__D1_DB__ = env.DB;
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
