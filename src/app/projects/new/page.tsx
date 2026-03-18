'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const TEMPLATES = [
  { id: 'general', name: '通用模板', description: '适用于普通项目' },
  { id: 'primary', name: '百校行动小学模板', description: '适用于小学项目' },
  { id: 'middle', name: '百校行动初中模板', description: '适用于初中项目' },
  { id: 'high', name: '百校行动高中模板', description: '适用于高中项目' },
];

export default function NewProject() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // 第一步表单
  const [projectName, setProjectName] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  
  // 第二步表单
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectManager || !projectNumber) {
      setError('请填写完整信息');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) {
      setError('请选择模板');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectName, 
          projectManager, 
          projectNumber,
          template: selectedTemplate 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/projects/${data.id}`);
      } else {
        setError(data.error || '创建失败');
      }
    } catch (err) {
      setError('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep(1);
    setError('');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {step === 1 ? '新建项目 - 基本信息' : '新建项目 - 选择模板'}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 步骤指示器 */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="text-sm">基本信息</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200">
              <div className={`h-full bg-blue-600 transition-all ${step === 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="text-sm">选择模板</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 1 ? (
          /* 第一步：基本信息 */
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-black text-black"
                  placeholder="请输入项目名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目经理 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-black text-black"
                  placeholder="请输入项目经理姓名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目编号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-black text-black"
                  placeholder="请输入项目编号"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  下一步
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* 第二步：选择模板 */
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">选择项目模板</h3>
                <div className="grid grid-cols-1 gap-4">
                  {TEMPLATES.map((template) => (
                    <label
                      key={template.id}
                      className={`relative p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={selectedTemplate === template.id}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{template.name}</h4>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 已填写信息预览 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">已填写信息</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">项目名称：</span>
                    <span className="text-gray-800">{projectName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">项目经理：</span>
                    <span className="text-gray-800">{projectManager}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">项目编号：</span>
                    <span className="text-gray-800">{projectNumber}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
