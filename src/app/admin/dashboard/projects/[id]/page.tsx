'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PRODUCTION_LINES, PROJECT_MATERIALS } from '@/lib/materials';

interface Material {
  id: string;
  materialName: string;
  materialGroup: string;
  productionLineId: string | null;
  isProjectMaterial: boolean;
  images: string[];
  files: string[];
}

interface Project {
  id: string;
  projectName: string;
  projectManager: string;
  projectNumber: string;
  selectedProducts: string[];
  createdAt: string;
  userId: string;
  username?: string;
}

export default function AdminProjectDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
  const [projectMaterialsExpanded, setProjectMaterialsExpanded] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin');
    } else if (status === 'authenticated') {
      fetchProject();
    }
  }, [status, router, params.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setMaterials(data.materials);
        if (data.project.selectedProducts) {
          setExpandedProducts(data.project.selectedProducts);
        }
      } else {
        router.push('/admin/dashboard/projects');
      }
    } catch (error) {
      console.error('获取项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProductIds = project?.selectedProducts || [];

  const getMaterialsByProduct = (productId: string) => {
    return materials.filter(m => m.materialGroup === productId);
  };

  const getLineNameByProductId = (productId: string) => {
    for (const line of PRODUCTION_LINES) {
      if (line.products.some(p => p.id === productId)) {
        return line.name;
      }
    }
    return '';
  };

  const getProductName = (productId: string) => {
    for (const line of PRODUCTION_LINES) {
      const product = line.products.find(p => p.id === productId);
      if (product) return product.name;
    }
    return productId;
  };

  const getMaterialProgress = (material: Material) => {
    return (material.images?.length || 0) + (material.files?.length || 0);
  };

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/admin' });
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/admin/dashboard/projects"
                className="mr-4 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{project.projectName}</h1>
                <p className="text-xs text-gray-600">
                  编号: {project.projectNumber} · 项目经理: {project.projectManager}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">{session?.user?.name}</span>
              <button onClick={handleSignOut} className="text-gray-600 hover:text-gray-800">
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 第一部分：产品部署与培训 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">一、产品部署与培训</h2>
          
          {selectedProductIds.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600 mb-4">暂未添加任何产品</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedProductIds.map(productId => {
                const productMaterials = getMaterialsByProduct(productId);
                const completedCount = productMaterials.filter(m => getMaterialProgress(m) > 0).length;
                const isExpanded = expandedProducts.includes(productId);
                const lineName = getLineNameByProductId(productId);
                const productName = getProductName(productId);

                return (
                  <div key={productId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* 产品标题 */}
                    <div 
                      className="flex items-center justify-between px-6 py-4 bg-gray-50 cursor-pointer"
                      onClick={() => toggleProduct(productId)}
                    >
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{lineName}</span>
                            <span className="font-medium text-gray-800">{productName}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {completedCount}/{productMaterials.length} 项已完成
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 材料列表 */}
                    {isExpanded && (
                      <div className="divide-y">
                        {productMaterials.map((material, idx) => (
                          <div key={material.id} className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800">{material.materialName}</h3>
                                
                                {/* 图片预览 */}
                                {material.images?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {material.images.map((img, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={img}
                                        alt={`图片 ${imgIdx + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                        onClick={() => window.open(img, '_blank')}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* 文件列表 */}
                                {material.files?.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {material.files.map((file, fileIdx) => (
                                      <div key={fileIdx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <a 
                                          href={file} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-sm text-blue-600 hover:text-blue-800 truncate"
                                        >
                                          {file.split('/').pop()}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {material.images?.length === 0 && material.files?.length === 0 && (
                                  <p className="text-sm text-gray-500 mt-2">暂无上传</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 第二部分：项目材料 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">二、项目材料</h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* 项目材料标题 */}
            <div 
              className="flex items-center gap-3 px-6 py-4 bg-gray-50 cursor-pointer"
              onClick={() => setProjectMaterialsExpanded(!projectMaterialsExpanded)}
            >
              <svg 
                className={`w-5 h-5 text-gray-600 transition-transform ${projectMaterialsExpanded ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div>
                <span className="font-medium text-gray-800">项目材料</span>
                <span className="text-gray-500 mx-2">|</span>
                <span className="text-sm text-gray-600">
                  {materials.filter(m => m.isProjectMaterial && getMaterialProgress(m) > 0).length}/{PROJECT_MATERIALS.length} 项已完成
                </span>
              </div>
            </div>

            {/* 项目材料列表 */}
            {projectMaterialsExpanded && (
              <div className="divide-y">
                {PROJECT_MATERIALS.map((pm, idx) => {
                  const material = materials.find(m => 
                    m.materialName === pm.name && m.isProjectMaterial
                  );

                  return (
                    <div key={pm.name} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800">{pm.name}</h3>
                          
                          {/* 图片预览 */}
                          {material && material.images && material.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {material.images.map((img, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={img}
                                  alt={`图片 ${imgIdx + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(img, '_blank')}
                                />
                              ))}
                            </div>
                          )}

                          {/* 文件列表 */}
                          {material && material.files && material.files.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {material.files.map((file, fileIdx) => (
                                <div key={fileIdx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <a 
                                    href={file} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 truncate"
                                  >
                                    {file.split('/').pop()}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}

                          {(!material || (material.images?.length === 0 && material.files?.length === 0)) && (
                            <p className="text-sm text-gray-500 mt-2">暂无上传</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
})}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
