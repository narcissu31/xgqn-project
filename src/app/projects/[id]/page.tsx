'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  PRODUCTION_LINES, 
  getProductsByLine, 
  PROJECT_MATERIALS,
  isBaixiaoTemplate
} from '@/lib/materials';

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
  template?: string;
  createdAt: string;
}

export default function ProjectDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 产品管理状态
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // 上传状态
  const [uploading, setUploading] = useState<string | null>(null);
  const [currentUploadMaterialId, setCurrentUploadMaterialId] = useState<string | null>(null);
  
  // 分组展开状态
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
  const [projectMaterialsExpanded, setProjectMaterialsExpanded] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
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
        // 展开所有已选择的产品
        if (data.project.selectedProducts) {
          setExpandedProducts(data.project.selectedProducts);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('获取项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取已选择的产品ID列表
  const selectedProductIds = project?.selectedProducts || [];

  // 获取某产品的所有材料
  const getMaterialsByProduct = (productId: string) => {
    return materials.filter(m => m.materialGroup === productId);
  };

  // 获取某产线的所有产品
  const getProductsByLineId = (lineId: string) => {
    const line = PRODUCTION_LINES.find(l => l.id === lineId);
    return line?.products || [];
  };

  // 获取某产品的产线名称
  const getLineNameByProductId = (productId: string) => {
    for (const line of PRODUCTION_LINES) {
      if (line.products.some(p => p.id === productId)) {
        return line.name;
      }
    }
    return '';
  };

  // 获取某产品的名称
  const getProductName = (productId: string) => {
    for (const line of PRODUCTION_LINES) {
      const product = line.products.find(p => p.id === productId);
      if (product) return product.name;
    }
    return productId;
  };

  // 添加产品
  const handleAddProduct = async () => {
    if (!selectedProduct) {
      alert('请选择产品');
      return;
    }

    try {
      // 更新项目选择的产品
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProducts: [...selectedProductIds, selectedProduct]
        }),
      });

      if (res.ok) {
        // 创建该产品的所有材料
        const line = PRODUCTION_LINES.find(l => l.products.some(p => p.id === selectedProduct));
        const product = line?.products.find(p => p.id === selectedProduct);
        
        if (product) {
          await fetch(`/api/projects/${params.id}/materials/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: params.id,
              productionLineId: line!.id,
              productId: selectedProduct,
              materialNames: product.materials.map(m => m.name)
            }),
          });
        }

        await fetchProject();
        setShowProductModal(false);
        setSelectedLine('');
        setSelectedProduct('');
      }
    } catch (error) {
      console.error('添加产品失败:', error);
      alert('添加产品失败');
    }
  };

  // 删除产品
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('确定删除该产品及其所有材料吗？')) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchProject();
      }
    } catch (error) {
      console.error('删除产品失败:', error);
    }
  };

  // 创建项目材料记录
  const ensureProjectMaterial = async (materialName: string) => {
    const existing = materials.find(m => m.materialName === materialName && m.isProjectMaterial);
    if (existing) return existing;

    try {
      const res = await fetch('/api/projects/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          materialName,
          materialGroup: 'project',
          isProjectMaterial: true
        }),
      });

      if (res.ok) {
        const newMaterial = await res.json();
        setMaterials(prev => [...prev, newMaterial]);
        return newMaterial;
      }
    } catch (error) {
      console.error('创建材料失败:', error);
    }
    return null;
  };

  // 上传文件
  const handleFileUpload = async (materialId: string, file: File) => {
    setUploading(materialId);

    try {
      const formData = new FormData();
      formData.append('materialId', materialId);
      formData.append('file', file);

      const res = await fetch(`/api/projects/${params.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setMaterials(prev => prev.map(m => m.id === materialId ? updated : m));
      } else {
        const data = await res.json();
        alert(data.error || '上传失败');
      }
    } catch (error) {
      alert('上传失败');
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 删除文件
  const handleDeleteFile = async (materialId: string, type: 'image' | 'file', index: number) => {
    if (!confirm('确定删除此文件吗？')) return;

    try {
      const res = await fetch(`/api/projects/${params.id}/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, type, index }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMaterials(prev => prev.map(m => m.id === materialId ? updated : m));
      }
    } catch (error) {
      alert('删除失败');
    }
  };

  // 触发文件选择
  const triggerUpload = (materialId: string) => {
    setCurrentUploadMaterialId(materialId);
    fileInputRef.current?.click();
  };

  // 计算材料完成进度
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 text-gray-700 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{project.projectName}</h1>
                <p className="text-xs text-gray-700">
                  {project.projectNumber} · {project.projectManager}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 只有通用模板显示添加产品按钮 */}
              {project.template !== 'primary' && project.template !== 'middle' && project.template !== 'high' && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  添加产品
                </button>
              )}
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
              {project.template === 'primary' || project.template === 'middle' || project.template === 'high' ? (
                <p className="text-gray-700">该模板已预置产品</p>
              ) : (
                <>
                  <p className="text-gray-700 mb-4">暂未添加任何产品</p>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    立即添加产品
                  </button>
                </>
              )}
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
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
                      <button
                        onClick={() => toggleProduct(productId)}
                        className="flex items-center gap-3 flex-1"
                      >
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
                          <p className="text-xs text-gray-700 mt-1">
                            {completedCount}/{productMaterials.length} 项已完成
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(productId)}
                        className="p-2 text-gray-600 hover:text-red-500 transition"
                        title="删除产品"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* 材料列表 */}
                    {isExpanded && (
                      <div className="divide-y">
                        {productMaterials.map((material, idx) => (
                          <MaterialItem
                            key={material.id}
                            material={material}
                            index={idx}
                            isUploading={uploading === material.id}
                            onUploadClick={() => triggerUpload(material.id)}
                            onFileSelect={(file) => handleFileUpload(material.id, file)}
                            onDeleteFile={(type, idx) => handleDeleteFile(material.id, type, idx)}
                          />
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
                <span className="text-gray-600 mx-2">|</span>
                <span className="text-sm text-gray-700">
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
                    <MaterialItem
                      key={pm.name}
                      material={material || {
                        id: '',
                        materialName: pm.name,
                        materialGroup: 'project',
                        productionLineId: null,
                        isProjectMaterial: true,
                        images: [],
                        files: []
                      }}
                      index={idx}
                      isUploading={uploading === material?.id}
                      onUploadClick={async () => {
                        if (material) {
                          triggerUpload(material.id);
                        } else {
                          const newMaterial = await ensureProjectMaterial(pm.name);
                          if (newMaterial) {
                            triggerUpload(newMaterial.id);
                          }
                        }
                      }}
                      onFileSelect={(file) => {
                        if (material) {
                          handleFileUpload(material.id, file);
                        }
                      }}
                      onDeleteFile={(type, idx) => material && handleDeleteFile(material.id, type, idx)}
                      isPlaceholder={!material}
                      projectId={project.id}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 添加产品弹窗 */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-800">添加产品</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-600 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 选择产线 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择产线</label>
                <select
                  value={selectedLine}
                  onChange={(e) => {
                    setSelectedLine(e.target.value);
                    setSelectedProduct('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">请选择产线</option>
                  {PRODUCTION_LINES.map(line => (
                    <option key={line.id} value={line.id}>{line.name}</option>
                  ))}
                </select>
              </div>

              {/* 选择产品 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择产品</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedLine}
                >
                  <option value="">请选择产品</option>
                  {selectedLine && getProductsByLineId(selectedLine)
                    .filter(p => !selectedProductIds.includes(p.id))
                    .map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleAddProduct}
                disabled={!selectedProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && currentUploadMaterialId) {
            handleFileUpload(currentUploadMaterialId, file);
          }
        }}
      />
    </div>
  );
}

// 材料项组件
function MaterialItem({ 
  material, 
  index,
  isUploading, 
  onUploadClick, 
  onFileSelect,
  onDeleteFile,
  isPlaceholder = false,
  projectId
}: {
  material: Material;
  index: number;
  isUploading: boolean;
  onUploadClick: () => void;
  onFileSelect: (file: File) => void;
  onDeleteFile: (type: 'image' | 'file', index: number) => void;
  isPlaceholder?: boolean;
  projectId?: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  // 获取文件名
  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        {/* 序号 */}
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
          {index + 1}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800">{material.materialName}</h3>
          
          {/* 图片预览 */}
          {material.images?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {material.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`图片 ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                    onClick={() => setLightbox(idx)}
                  />
                  <button
                    onClick={() => onDeleteFile('image', idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 文件列表 */}
          {material.files?.length > 0 && (
            <div className="mt-3 space-y-1">
              {material.files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg group">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-600 truncate">{getFileName(file)}</span>
                  </div>
                  <button
                    onClick={() => onDeleteFile('file', idx)}
                    className="p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 上传按钮 */}
          {!isPlaceholder && (
            <button
              onClick={onUploadClick}
              disabled={isUploading}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition disabled:opacity-50"
            >
              {isUploading ? '上传中...' : '+ 上传文件'}
            </button>
          )}

          {isPlaceholder && (
            <p className="mt-2 text-sm text-gray-600">暂无材料</p>
          )}
        </div>
      </div>

      {/* 灯箱预览 */}
      {lightbox !== null && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={material.images[lightbox]}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
