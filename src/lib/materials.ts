/**
 * 通用模板数据结构
 *
 * 结构：
 * - 产线 (ProductionLine) → 产品 (Product) → 材料 (Material)
 * - 项目材料 (ProjectMaterial) - 固定内容
 */

// 材料项定义
export interface MaterialItem {
  name: string;
}

// 产线定义
export interface ProductionLine {
  id: string;
  name: string;
  products: Product[];
}

// 产品定义
export interface Product {
  id: string;
  name: string;
  materials: MaterialItem[];
}

// 项目材料定义（第二部分，固定展示）
export interface ProjectMaterial {
  name: string;
}

// ==================== 通用模板数据 ====================

// 产线列表
export const PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'dakt',
    name: '大课堂',
    products: [
      {
        id: 'qzk',
        name: '轻智课',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（教师）' },
        ]
      },
      {
        id: 'bzzk',
        name: '标准智课',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（师生）' },
          { name: '超脑上墙、激活' },
          { name: '充电车部署、平板入车、贴编号标签' },
        ]
      },
      {
        id: 'ktsl',
        name: '课堂实录与分析',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（教师）' },
        ]
      },
      {
        id: 'xhjs',
        name: '星火教师助手',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（教师）' },
        ]
      },
      {
        id: 'zhc',
        name: '智慧窗',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（教师）' },
          { name: '智慧窗部署照片' },
        ]
      },
    ]
  },
  {
    id: 'dxq',
    name: '大学情',
    products: [
      {
        id: 'dsjjd',
        name: '大数据精准教学系统（或网手阅）',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（管理员）' },
          { name: '培训照片（全体教师）' },
          { name: '扫描仪部署、驱动、扫描软件安装' },
        ]
      },
      {
        id: 'pyj',
        name: '批阅机',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（管理员）' },
          { name: '培训照片（学科教师）' },
          { name: '硬件部署照片' },
        ]
      },
    ]
  },
  {
    id: 'ypt',
    name: '云平台',
    products: [
      {
        id: 'sjtjzt',
        name: '市（区）级中台',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（管理员）' },
        ]
      },
      {
        id: 'xjzt',
        name: '校级中台',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（管理员）' },
        ]
      },
    ]
  },
  {
    id: 'qm',
    name: '启明',
    products: [
      {
        id: 'tskc',
        name: 'AI听说课堂',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（师生）' },
          { name: '设备部署照片' },
        ]
      },
      {
        id: 'ztkt',
        name: '专题课堂',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（师生）' },
          { name: '超脑上墙、激活' },
          { name: '充电车部署、平板入车、贴编号标签' },
          { name: '练字笔部署照片' },
          { name: '练字笔培训照片' },
          { name: '耳机标签照片' },
        ]
      },
    ]
  },
  {
    id: 'kcjy',
    name: '科创教育',
    products: [
      {
        id: 'xfmllk',
        name: '讯飞美丽科学',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（师生）' },
        ]
      },
      {
        id: 'rgznsy',
        name: '人工智能实验室',
        materials: [
          { name: '培训签到表' },
          { name: '培训效果反馈表' },
          { name: '培训确认单' },
          { name: '软件、账号验证' },
          { name: '培训照片（师生）' },
          { name: '充电车部署、平板入车、贴编号标签' },
          { name: 'AP部署照片' },
          { name: '服务器部署照片' },
          { name: '未来派、小飞机器人、智能小车等部署照片' },
          { name: '装修完工照片' },
        ]
      },
    ]
  },
];

// 项目材料列表（第二部分，固定展示）
export const PROJECT_MATERIALS: ProjectMaterial[] = [
  { name: '服务运营（培训）方案' },
  { name: '培训总结' },
  { name: '到货签收单' },
  { name: '项目验收单' },
  { name: '硬件部署位置表' },
  { name: '合格证' },
  { name: '软装完成照片' },
];

// 辅助函数：获取所有产线名称
export function getProductionLineNames(): string[] {
  return PRODUCTION_LINES.map(line => line.name);
}

// 辅助函数：根据产线名称获取产品列表
export function getProductsByLine(lineName: string): { id: string; name: string }[] {
  const line = PRODUCTION_LINES.find(l => l.name === lineName);
  return line ? line.products.map(p => ({ id: p.id, name: p.name })) : [];
}

// 辅助函数：根据产线ID和产品ID获取材料列表
export function getMaterialsByProduct(lineId: string, productId: string): MaterialItem[] {
  const line = PRODUCTION_LINES.find(l => l.id === lineId);
  if (!line) return [];
  const product = line.products.find(p => p.id === productId);
  return product ? product.materials : [];
}

// ==================== 百校行动模板配置 ====================

// 百校模板类型
export type BaixiaoTemplate = 'primary' | 'middle' | 'high';

// 百校模板定义（固定产品）
export const BAIXIAO_TEMPLATES: Record<BaixiaoTemplate, { name: string; products: string[] }> = {
  // 小学模板
  primary: {
    name: '百校行动小学模板',
    products: [
      'qzk',           // 轻智课
      'tskc',         // AI听说课堂
      'ztkt',         // 专题课堂
      'xhjs',         // 星火教师助手
      'zhc',          // 智慧窗
      'xjzt',         // 校级中台
      'xfmllk',       // 讯飞美丽科学
    ]
  },
  // 初中模板
  middle: {
    name: '百校行动初中模板',
    products: [
      'qzk',           // 轻智课
      'tskc',         // AI听说课堂
      'xhjs',         // 星火教师助手
      'zhc',          // 智慧窗
      'xjzt',         // 校级中台
      'pyj',          // 批阅机
      'dsjjd',        // 大数据精准教学系统（或网手阅）
    ]
  },
  // 高中模板
  high: {
    name: '百校行动高中模板',
    products: [
      'qzk',           // 轻智课
      'bzzk',         // 标准智课
      'xhjs',         // 星火教师助手
      'zhc',          // 智慧窗
      'xjzt',         // 校级中台
      'pyj',          // 批阅机
      'dsjjd',        // 大数据精准教学系统（或网手阅）
    ]
  }
};

// 检查是否为百校模板
export function isBaixiaoTemplate(template: string): template is BaixiaoTemplate {
  return ['primary', 'middle', 'high'].includes(template);
}

// 获取模板的固定产品ID列表
export function getBaixiaoProducts(template: string): string[] {
  if (isBaixiaoTemplate(template)) {
    return BAIXIAO_TEMPLATES[template].products;
  }
  return [];
}

// 获取模板名称
export function getTemplateDisplayName(template: string): string {
  if (isBaixiaoTemplate(template)) {
    return BAIXIAO_TEMPLATES[template].name;
  }
  if (template === 'general') {
    return '通用模板';
  }
  return template;
}
