'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  deletedAt?: string;
}

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        // 分离正常用户和已删除用户
        setUsers(data.filter((u: any) => !u.deletedAt));
        setDeletedUsers(data.filter((u: any) => u.deletedAt));
      }
    } catch (error) {
      console.error('获取用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/admin' });
  };

  // 添加用户
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || '创建失败');
      }
    } catch (error) {
      alert('创建失败');
    }
  };

  // 删除用户（移到回收站）
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该用户吗？')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [id] }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!resetPassword) return;
    
    const idsToReset = selectedUserId ? [selectedUserId] : selectedIds;
    if (idsToReset.length === 0) {
      alert('请选择用户');
      return;
    }

    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: idsToReset, newPassword: resetPassword }),
      });
      if (res.ok) {
        setShowResetModal(false);
        setResetPassword('');
        setSelectedUserId(null);
        setSelectedIds([]);
        alert('密码重置成功');
      } else {
        alert('重置失败');
      }
    } catch (error) {
      alert('重置失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.length} 个用户吗？`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        setShowBatchActions(false);
        fetchData();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 恢复用户
  const handleRestore = async (id: string) => {
    if (!confirm('确定要恢复该用户吗？')) return;
    try {
      const res = await fetch('/api/admin/users/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', userIds: [id] }),
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('恢复失败');
      }
    } catch (error) {
      alert('恢复失败');
    }
  };

  // 彻底删除用户
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('确定要彻底删除该用户吗？此操作不可恢复！')) return;
    try {
      const res = await fetch('/api/admin/users/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanentDelete', userIds: [id] }),
      });
      if (res.ok) {
        fetchData();
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
    if (!confirm(`确定要恢复选中的 ${selectedIds.length} 个用户吗？`)) return;
    try {
      const res = await fetch('/api/admin/users/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', userIds: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
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
    if (!confirm(`确定要彻底删除选中的 ${selectedIds.length} 个用户吗？此操作不可恢复！`)) return;
    try {
      const res = await fetch('/api/admin/users/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanentDelete', userIds: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 全选
  const handleSelectAll = (list: User[]) => {
    if (isSelectAll) setSelectedIds([]);
    else setSelectedIds(list.map(u => u.id));
    setIsSelectAll(!isSelectAll);
  };

  // 单选
  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    setIsSelectAll(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const role = (session?.user as any)?.role;
  const isAdmin = role === 'admin';

  if (!isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const currentList = showRecycleBin ? deletedUsers : users;
  const currentIsSelectAll = showRecycleBin 
    ? isSelectAll && deletedUsers.length > 0 && selectedIds.length === deletedUsers.length
    : isSelectAll && users.length > 0 && selectedIds.length === users.length;

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
              <h1 className="text-xl font-bold text-gray-800">用户管理</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">{session?.user?.name}</span>
              <button onClick={handleSignOut} className="text-gray-500 hover:text-gray-700">退出登录</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签切换 + 操作按钮 */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRecycleBin(false); setSelectedIds([]); setIsSelectAll(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!showRecycleBin ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                用户列表 ({users.length})
              </button>
              <button
                onClick={() => { setShowRecycleBin(true); setSelectedIds([]); setIsSelectAll(false); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showRecycleBin ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                用户回收站 ({deletedUsers.length})
              </button>
            </div>
            
            {!showRecycleBin && (
              <div className="flex gap-2">
                {users.length > 0 && (
                  <button onClick={() => setShowBatchActions(!showBatchActions)} className="text-sm text-blue-600 hover:text-blue-800">
                    {showBatchActions ? '取消批量操作' : '批量操作'}
                  </button>
                )}
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  添加用户
                </button>
              </div>
            )}
            {showRecycleBin && deletedUsers.length > 0 && (
              <button onClick={() => setShowBatchActions(!showBatchActions)} className="text-sm text-blue-600 hover:text-blue-800">
                {showBatchActions ? '取消批量操作' : '批量操作'}
              </button>
            )}
          </div>

          {/* 批量操作栏 */}
          {showBatchActions && currentList.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={currentIsSelectAll} onChange={() => handleSelectAll(currentList)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">全选</span>
                </label>
                <span className="text-sm text-gray-500">已选 {selectedIds.length} 项</span>
              </div>
              <div className="flex gap-2">
                {!showRecycleBin ? (
                  <>
                    <button 
                      onClick={() => setShowResetModal(true)} 
                      disabled={selectedIds.length === 0} 
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      批量重置密码
                    </button>
                    <button 
                      onClick={handleBatchDelete} 
                      disabled={selectedIds.length === 0} 
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      批量删除
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleBatchRestore} 
                      disabled={selectedIds.length === 0} 
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      批量恢复
                    </button>
                    <button 
                      onClick={handleBatchPermanentDelete} 
                      disabled={selectedIds.length === 0} 
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      批量彻底删除
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-xl shadow-sm border">
          {currentList.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>{showRecycleBin ? '回收站是空的' : '暂无用户'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {currentList.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {showBatchActions && (
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => handleSelect(user.id)} className="w-4 h-4 text-blue-600 rounded" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-800">{user.username}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        角色: {user.role === 'admin' ? '管理员' : '普通用户'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {showRecycleBin 
                          ? `删除于: ${user.deletedAt ? new Date(user.deletedAt).toLocaleString('zh-CN') : ''}`
                          : `创建于: ${new Date(user.createdAt).toLocaleDateString('zh-CN')}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!showRecycleBin ? (
                      <>
                        <button onClick={() => { setSelectedUserId(user.id); setShowResetModal(true); }} className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200">
                          重置密码
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">
                          删除
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleRestore(user.id)} className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200">
                          恢复
                        </button>
                        <button onClick={() => handlePermanentDelete(user.id)} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200">
                          彻底删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 添加用户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">添加用户</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-black">
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">重置密码</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input 
                  type="password" 
                  value={resetPassword} 
                  onChange={(e) => setResetPassword(e.target.value)} 
                  className="w-full px-4 py-2 border rounded-lg text-black" 
                  placeholder="请输入新密码" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowResetModal(false); setResetPassword(''); setSelectedUserId(null); }} 
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button onClick={handleResetPassword} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
