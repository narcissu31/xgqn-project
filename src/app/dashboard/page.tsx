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
  template?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectManager, setEditProjectManager] = useState('');
  const [editProjectNumber, setEditProjectNumber] = useState('');
  
  // 搜索状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [searchManager, setSearchManager] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');

  const TEMPLATE_NAMES: Record<string, string> = {
    general: '通用模板',
    primary: '百校行动小学模板',
    middle: '百校行动初中模板',
    high: '百校行动高中模板'
  };

  const getTemplateName = (template?: string) => {
    return template ? (TEMPLATE_NAMES[template] || template) : '通用模板';
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('获取项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  // 移到回收站（软删除）
  const handleDelete = async (id: string) => {
    if (!confirm('确定要将项目移到回收站吗？')) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: [id] }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  // 打开编辑弹窗
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setEditProjectName(project.projectName);
    setEditProjectManager(project.projectManager);
    setEditProjectNumber(project.projectNumber);
    setShowEditModal(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingProject) return;
    if (!editProjectName || !editProjectManager || !editProjectNumber) {
      alert('请填写完整信息');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: editProjectName,
          projectManager: editProjectManager,
          projectNumber: editProjectNumber
        }),
      });

      if (res.ok) {
        setProjects(prev => prev.map(p => 
          p.id === editingProject.id 
            ? { ...p, projectName: editProjectName, projectManager: editProjectManager, projectNumber: editProjectNumber }
            : p
        ));
        setShowEditModal(false);
        setEditingProject(null);
      } else {
        alert('保存失败');
      }
    } catch (error) {
      alert('保存失败');
    }
  };

  // 批量移到回收站
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要将选中的 ${selectedIds.length} 个项目移到回收站吗？`)) return;
    
    try {
      const res = await fetch('/api/recycle-bin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: selectedIds }),
      });
      
      if (res.ok) {
        setProjects(prev => prev.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBatchActions(false);
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProjects.map(p => p.id));
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

  // 过滤项目
  const filteredProjects = projects.filter(project => {
    // 项目名称模糊搜索
    if (searchName && !project.projectName.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }
    // 项目编号精确或模糊匹配
    if (searchNumber && !project.projectNumber.toLowerCase().includes(searchNumber.toLowerCase())) {
      return false;
    }
    // 项目经理模糊搜索
    if (searchManager && !project.projectManager.toLowerCase().includes(searchManager.toLowerCase())) {
      return false;
    }
    // 开始时间过滤
    if (searchStartDate) {
      const projectDate = new Date(project.createdAt);
      const startDate = new Date(searchStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (projectDate < startDate) {
        return false;
      }
    }
    // 结束时间过滤
    if (searchEndDate) {
      const projectDate = new Date(project.createdAt);
      const endDate = new Date(searchEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (projectDate > endDate) {
        return false;
      }
    }
    return true;
  });

  // 重置搜索
  const resetSearch = () => {
    setSearchName('');
    setSearchNumber('');
    setSearchManager('');
    setSearchStartDate('');
    setSearchEndDate('');
  };

  // 检查是否有搜索条件
  const hasSearchCondition = searchName || searchNumber || searchManager || searchStartDate || searchEndDate;

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
              <h1 className="text-xl font-bold text-gray-800">项目交付材料收集</h1>
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
        {/* 功能按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
          <Link href="/projects/new" className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">新建项目</h2>
                <p className="text-gray-500 text-sm">创建新项目并上传交付材料</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 项目列表 */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {isAdmin ? '全部项目' : '我的项目'}
              {hasSearchCondition && <span className="ml-2 text-sm font-normal text-gray-500">(已筛选)</span>}
            </h2>
            <div className="flex items-center gap-3">
              {projects.length > 0 && (
                <button onClick={() => setShowSearch(!showSearch)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {showSearch ? '收起搜索' : '搜索项目'}
                </button>
              )}
              {projects.length > 0 && (
                <button onClick={() => setShowBatchActions(!showBatchActions)} className="text-sm text-blue-600 hover:text-blue-800">
                  {showBatchActions ? '取消批量操作' : '批量操作'}
                </button>
              )}
            </div>
          </div>
          
          {/* 搜索栏 */}
          {showSearch && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">项目名称</label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="模糊搜索"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">项目编号</label>
                  <input
                    type="text"
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    placeholder="搜索编号"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">项目经理</label>
                  <input
                    type="text"
                    value={searchManager}
                    onChange={(e) => setSearchManager(e.target.value)}
                    placeholder="模糊搜索"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">开始时间</label>
                  <input
                    type="date"
                    value={searchStartDate}
                    onChange={(e) => setSearchStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">结束时间</label>
                  <input
                    type="date"
                    value={searchEndDate}
                    onChange={(e) => setSearchEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-black"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={resetSearch}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  重置
                </button>
              </div>
            </div>
          )}

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
              <button onClick={handleBatchDelete} disabled={selectedIds.length === 0} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                批量删除
              </button>
            </div>
          )}

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {hasSearchCondition ? (
                <>
                  <p>没有找到符合条件的项目</p>
                  <button onClick={resetSearch} className="text-blue-600 hover:underline mt-2 inline-block">清除搜索条件</button>
                </>
              ) : (
                <>
                  <p>暂无项目</p>
                  <Link href="/projects/new" className="text-blue-600 hover:underline mt-2 inline-block">创建一个新项目</Link>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    {showBatchActions && (
                      <input type="checkbox" checked={selectedIds.includes(project.id)} onChange={() => handleSelect(project.id)} className="w-4 h-4 text-blue-600 rounded" />
                    )}
                    <Link href={`/projects/${project.id}`} className="flex-1">
                      <h3 className="font-medium text-gray-800">{project.projectName}</h3>
                      <p className="text-sm text-gray-500 mt-1">编号: {project.projectNumber} · 项目经理: {project.projectManager}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        模板: {getTemplateName(project.template)} · 创建于: {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(project)} className="p-2 text-gray-600 hover:text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <Link href={`/projects/${project.id}`} className="p-2 text-gray-600 hover:text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <button onClick={() => handleDelete(project.id)} className="p-2 text-gray-600 hover:text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 编辑项目弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">编辑项目</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称</label>
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目经理</label>
                <input
                  type="text"
                  value={editProjectManager}
                  onChange={(e) => setEditProjectManager(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目编号</label>
                <input
                  type="text"
                  value={editProjectNumber}
                  onChange={(e) => setEditProjectNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowEditModal(false); setEditingProject(null); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
