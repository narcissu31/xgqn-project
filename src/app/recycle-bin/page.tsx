'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  projectName: string;
  projectManager: string;
  projectNumber: string;
  createdAt: string;
  deletedAt: string;
  userId: string;
}

export default function RecycleBin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/recycle-bin');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('获取回收站失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // 恢复项目
  const handleRestore = async (id: string) => {
    if (!confirm('确定要恢复这个项目吗？')) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', projectIds: [id] }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        alert('恢复失败');
      }
    } catch (error) {
      alert('恢复失败');
    }
  };

  // 彻底删除
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('确定要彻底删除这个项目吗？此操作不可恢复！')) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanentDelete', projectIds: [id] }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 批量恢复
  const handleBatchRestore = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要恢复选中的 ${selectedIds.length} 个项目吗？`)) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', projectIds: selectedIds }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBatchActions(false);
      } else {
        alert('恢复失败');
      }
    } catch (error) {
      alert('恢复失败');
    }
  };

  // 批量彻底删除
  const handleBatchPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要彻底删除选中的 ${selectedIds.length} 个项目吗？此操作不可恢复！`)) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanentDelete', projectIds: selectedIds }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBatchActions(false);
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(projects.map(p => p.id));
    }
    setIsSelectAll(!isSelectAll);
  };

  // 单个选择
  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
    setIsSelectAll(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm">首页</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-800">回收站</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/recycle-bin" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">回收站</span>
              </Link>
              <span className="text-gray-600">{session?.user?.name}</span>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 回收站列表 */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800">回收站</h2>
              <span className="text-sm text-gray-500">({projects.length})</span>
            </div>
            {projects.length > 0 && (
              <button onClick={() => setShowBatchActions(!showBatchActions)} className="text-sm text-blue-600 hover:text-blue-800">
                {showBatchActions ? '取消批量操作' : '批量操作'}
              </button>
            )}
          </div>

          {/* 批量操作栏 */}
          {showBatchActions && projects.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isSelectAll} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">全选</span>
                </label>
                <span className="text-sm text-gray-500">已选 {selectedIds.length} 项</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleBatchRestore} disabled={selectedIds.length === 0} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  批量恢复
                </button>
                <button onClick={handleBatchPermanentDelete} disabled={selectedIds.length === 0} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  彻底删除
                </button>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <p>回收站是空的</p>
              <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">返回首页</Link>
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((project) => (
                <div key={project.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    {showBatchActions && (
                      <input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => handleSelect(project.id)} className="w-4 h-4 text-blue-600 rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{project.projectName}</h3>
                      <p className="text-sm text-gray-500 mt-1">编号: {project.projectNumber} · 项目经理: {project.projectManager}</p>
                      <p className="text-xs text-gray-400 mt-1">删除于: {new Date(project.deletedAt).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRestore(project.id)} className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200">
                      恢复
                    </button>
                    <button onClick={() => handlePermanentDelete(project.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">
                      彻底删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
