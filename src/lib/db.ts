import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DB_PATH, 'users.json');
const PROJECTS_FILE = path.join(DB_PATH, 'projects.json');
const MATERIALS_FILE = path.join(DB_PATH, 'materials.json');

// 确保数据目录存在
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// 初始化空数据库
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(MATERIALS_FILE)) {
  fs.writeFileSync(MATERIALS_FILE, JSON.stringify([]));
}

// 读取数据
function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function readProjects() {
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
}

function readMaterials() {
  return JSON.parse(fs.readFileSync(MATERIALS_FILE, 'utf-8'));
}

// 写入数据
function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function writeProjects(projects: any[]) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function writeMaterials(materials: any[]) {
  fs.writeFileSync(MATERIALS_FILE, JSON.stringify(materials, null, 2));
}

// ==================== 用户操作 ====================

export function createUser(username: string, password: string, role: string = 'user') {
  const users = readUsers();
  const existing = users.find((u: any) => u.username === username);
  if (existing) throw new Error('用户名已存在');
  
  const user = { id: uuidv4(), username, password, role, createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  return user;
}

export function getUserByUsername(username: string) {
  const users = readUsers();
  return users.find((u: any) => u.username === username);
}

export function getUserById(id: string) {
  const users = readUsers();
  return users.find((u: any) => u.id === id);
}

export function getAllUsers() {
  return readUsers();
}

export function softDeleteUser(id: string) {
  const users = readUsers();
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    users[index].deletedAt = new Date().toISOString();
    writeUsers(users);
  }
}

export function getDeletedUsers() {
  const users = readUsers();
  return users.filter((u: any) => u.deletedAt);
}

export function restoreUser(id: string) {
  const users = readUsers();
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    delete users[index].deletedAt;
    writeUsers(users);
  }
}

export function deleteUser(id: string) {
  const users = readUsers();
  const filtered = users.filter((u: any) => u.id !== id);
  writeUsers(filtered);
}

export function permanentlyDeleteUser(id: string) {
  deleteUser(id);
}

export function resetUserPassword(id: string, newPassword: string) {
  const users = readUsers();
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    const bcrypt = require('bcryptjs');
    users[index].password = bcrypt.hashSync(newPassword, 10);
    writeUsers(users);
    return true;
  }
  return false;
}

// ==================== 项目操作 ====================

export function createProject(data: { projectName: string; projectManager: string; projectNumber: string; userId: string; template?: string }) {
  const projects = readProjects();
  const project = {
    id: uuidv4(),
    projectName: data.projectName,
    projectManager: data.projectManager,
    projectNumber: data.projectNumber,
    userId: data.userId,
    template: data.template || 'general',
    // 新增：项目已选择的产品（产线ID和产品ID列表）
    selectedProducts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(project);
  writeProjects(projects);
  return project;
}

export function getProjectsByUserId(userId: string) {
  const projects = readProjects();
  return projects
    .filter((p: any) => p.userId === userId && !p.deleted)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProjectById(id: string) {
  const projects = readProjects();
  return projects.find((p: any) => p.id === id);
}

export function updateProject(id: string, data: { projectName?: string; projectManager?: string; projectNumber?: string; selectedProducts?: string[] }) {
  const projects = readProjects();
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    if (data.projectName) projects[index].projectName = data.projectName;
    if (data.projectManager) projects[index].projectManager = data.projectManager;
    if (data.projectNumber) projects[index].projectNumber = data.projectNumber;
    if (data.selectedProducts) projects[index].selectedProducts = data.selectedProducts;
    projects[index].updatedAt = new Date().toISOString();
    writeProjects(projects);
    return projects[index];
  }
  return null;
}

export function getAllProjects() {
  const projects = readProjects();
  return projects
    .filter((p: any) => !p.deleted)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 获取所有项目（包括已删除的，用于管理员查询）
export function getAllProjectsIncludingDeleted() {
  const projects = readProjects();
  return projects.sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteProject(id: string) {
  const projects = readProjects();
  const filtered = projects.filter((p: any) => p.id !== id);
  writeProjects(filtered);
}

// 删除项目及所有关联文件
function deleteAllMaterialFiles(materials: any[]) {
  materials.forEach((material: any) => {
    // 删除图片
    if (material.images && Array.isArray(material.images)) {
      material.images.forEach((imgPath: string) => {
        const fullPath = path.join(process.cwd(), 'public', imgPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    // 删除文件
    if (material.files && Array.isArray(material.files)) {
      material.files.forEach((filePath: string) => {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
  });
}

export function deleteProjectWithFiles(projectId: string) {
  const materials = readMaterials();
  const projectMaterials = materials.filter((m: any) => m.projectId === projectId);
  
  // 删除关联的文件
  deleteAllMaterialFiles(projectMaterials);
  
  // 删除项目
  deleteProject(projectId);
  
  // 删除材料记录
  const filteredMaterials = materials.filter((m: any) => m.projectId !== projectId);
  writeMaterials(filteredMaterials);
}

export function softDeleteProject(id: string) {
  const projects = readProjects();
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    projects[index].deleted = true;
    projects[index].deletedAt = new Date().toISOString();
    projects[index].deletedBy = null;
    writeProjects(projects);
  }
}

export function getDeletedProjects() {
  const projects = readProjects();
  return projects.filter((p: any) => p.deleted === true).sort((a: any, b: any) => 
    new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
}

export function restoreProject(id: string) {
  const projects = readProjects();
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    projects[index].deleted = false;
    delete projects[index].deletedAt;
    delete projects[index].deletedBy;
    writeProjects(projects);
  }
}

export function permanentlyDeleteProject(id: string) {
  const materials = readMaterials();
  const projectMaterials = materials.filter((m: any) => m.projectId === id);
  
  // 删除所有文件
  deleteAllMaterialFiles(projectMaterials);
  
  // 删除项目
  deleteProject(id);
  
  // 删除材料记录
  const filteredMaterials = materials.filter((m: any) => m.projectId !== id);
  writeMaterials(filteredMaterials);
}

// ==================== 材料操作 ====================

// 材料类型
export type MaterialType = 'image' | 'file';

/**
 * 创建材料记录
 * @param data 材料数据
 * @param data.projectId 项目ID
 * @param data.materialName 材料名称
 * @param data.materialGroup 分组（产品ID 或 'project'）
 * @param data.productionLineId 产线ID（可选）
 * @param data.isProjectMaterial 是否为项目材料
 */
export function createMaterial(data: { 
  projectId: string; 
  materialName: string; 
  materialGroup: string;
  productionLineId?: string;
  isProjectMaterial?: boolean;
}) {
  const materials = readMaterials();
  const material = {
    id: uuidv4(),
    projectId: data.projectId,
    materialName: data.materialName,
    materialGroup: data.materialGroup,  // 产品ID 或 'project'
    productionLineId: data.productionLineId || null,  // 产线ID
    isProjectMaterial: data.isProjectMaterial || false,  // 是否为项目材料
    images: [],  // 图片列表
    files: [],   // 文件列表
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  materials.push(material);
  writeMaterials(materials);
  return material;
}

export function getMaterialsByProjectId(projectId: string) {
  const materials = readMaterials();
  return materials.filter((m: any) => m.projectId === projectId);
}

export function getMaterialById(id: string) {
  const materials = readMaterials();
  return materials.find((m: any) => m.id === id);
}

/**
 * 更新材料 - 同时更新图片和文件
 */
export function updateMaterial(id: string, data: { images?: string[]; files?: string[] }) {
  const materials = readMaterials();
  const index = materials.findIndex((m: any) => m.id === id);
  if (index === -1) throw new Error('材料不存在');
  
  if (data.images !== undefined) {
    materials[index].images = data.images;
  }
  if (data.files !== undefined) {
    materials[index].files = data.files;
  }
  materials[index].updatedAt = new Date().toISOString();
  writeMaterials(materials);
  return materials[index];
}

/**
 * 获取或创建材料
 */
export function getOrCreateMaterial(projectId: string, materialName: string, materialGroup: string, productionLineId?: string, isProjectMaterial?: boolean) {
  const materials = readMaterials();
  let material = materials.find((m: any) => 
    m.projectId === projectId && 
    m.materialName === materialName && 
    m.materialGroup === materialGroup
  );
  
  if (!material) {
    material = createMaterial({ projectId, materialName, materialGroup, productionLineId, isProjectMaterial });
  }
  return material;
}

/**
 * 批量创建产品材料
 * @param projectId 项目ID
 * @param productionLineId 产线ID
 * @param productId 产品ID
 * @param materials 材料名称列表
 */
export function batchCreateProductMaterials(projectId: string, productionLineId: string, productId: string, materials: string[]) {
  materials.forEach(materialName => {
    getOrCreateMaterial(projectId, materialName, productId, productionLineId, false);
  });
}

/**
 * 批量创建项目材料
 * @param projectId 项目ID
 * @param materials 材料名称列表
 */
export function batchCreateProjectMaterials(projectId: string, materials: string[]) {
  materials.forEach(materialName => {
    getOrCreateMaterial(projectId, materialName, 'project', undefined, true);
  });
}

/**
 * 删除产品的所有材料记录
 */
export function deleteProductMaterials(projectId: string, productId: string) {
  const materials = readMaterials();
  const productMaterials = materials.filter((m: any) => 
    m.projectId === projectId && m.materialGroup === productId
  );
  
  // 删除关联文件
  deleteAllMaterialFiles(productMaterials);
  
  // 删除材料记录
  const filteredMaterials = materials.filter((m: any) => 
    !(m.projectId === projectId && m.materialGroup === productId)
  );
  writeMaterials(filteredMaterials);
}
