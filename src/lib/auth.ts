import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByUsername, createUser } from './db';

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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码');
        }

        // 验证用户名格式
        if (!validateUsername(credentials.username)) {
          throw new Error('用户名仅支持小写字母，或小写字母加数字组合');
        }

        // 验证密码格式
        if (!validatePassword(credentials.password)) {
          throw new Error('密码至少8位，需包含大写字母、小写字母、数字、符号中至少两种');
        }

        const user = await getUserByUsername(credentials.username);
        
        if (!user) {
          // 自动注册新用户
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          const newUser = await createUser(credentials.username, hashedPassword, 'user');
          return {
            id: newUser.id,
            name: newUser.username,
            role: newUser.role,
            username: newUser.username
          };
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error('密码错误');
        }

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          username: user.username
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'delivery-materials-secret-key-2024',
};
