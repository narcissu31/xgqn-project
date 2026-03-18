'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  projectName: string;
  projectManager: string;
  projectNumber: string;
  createdAt: string;
  userId: string;
  username?: string;
}

export default function AdminProjects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchUsername, setSearchUsername] = useState('');
  const [searchProjectNumber, setSearchProjectNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        
        const usersRes = await fetch('/api/admin/users');
        const users = await usersRes.json();
        const userMap: Record<string, string> = {};
        users.forEach((u: any) => { userMap[u.id] = u.username });
        
        const projectsWithUsername = data.map((p: any) => ({
          ...p,
          username: userMap[p.userId] || '未知'
        }));
        
        setProjects(projectsWithUsername);
      }
    } catch (error) {
      console.error('获取项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/admin' });
  };

  const filteredProjects = projects.filter(p => {
    if (searchUsername && !p.username?.toLowerCase().includes(searchUsername.toLowerCase()) && 
        !p.projectName.toLowerCase().includes(searchUsername.toLowerCase()) &&
        !p.projectManager.toLowerCase().includes(searchUsername.toLowerCase())) {
      return false;
    }
    
    if (searchProjectNumber && !p.projectNumber.toLowerCase().includes(searchProjectNumber.toLowerCase())) {
      return false;
    }
    
    if (startDate) {
      const projectDate = new Date(p.createdAt);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (projectDate < start) return false;
    }
    
    if (endDate) {
      const projectDate = new Date(p.createdAt);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (projectDate > end) return false;
    }
    
    return true;
  });

  const clearSearch = () => {
    setSearchUsername('');
    setSearchProjectNumber('');
    setStartDate('');
    setEndDate('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session?.user as any)?.role;
  const isAdmin = role === 'admin';

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/dashboard" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">返回</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">项目管理</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{session?.user?.name}</span>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">退出登录</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">搜索条件</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-2 border rounded-lg text-black placeholder:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目编号</label>
              <input
                type="text"
                value={searchProjectNumber}
                onChange={(e) => setSearchProjectNumber(e.target.value)}
                placeholder="请输入项目编号"
                className="w-full px-4 py-2 border rounded-lg text-black placeholder:text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black"
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={clearSearch} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                清空
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              所有项目 ({filteredProjects.length})
            </h2>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>暂无项目</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <Link href={`/admin/dashboard/projects/${project.id}`} className="flex-1">
                    <h3 className="font-medium text-gray-800">{project.projectName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      编号: {project.projectNumber} · 项目经理: {project.projectManager}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      创建者: {project.username} · 创建于: {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </Link>
                  <Link href={`/admin/dashboard/projects/${project.id}`} className="p-2 text-gray-400 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
