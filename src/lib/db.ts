import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 数据目录 - Cloudflare Workers 使用 /tmp 目录
const DATA_DIR = process.env.CLOUDFLARE_WORKERS ? '/tmp/data' : join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const PROJECTS_FILE = join(DATA_DIR, 'projects.json');
const MATERIALS_FILE = join(DATA_DIR, 'materials.json');

// 确保数据目录存在
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 读取 JSON 文件
function readJsonFile(filePath: string): any[] {
  try {
    if (!existsSync(filePath)) return [];
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 写入 JSON 文件
function writeJsonFile(filePath: string, data: any[]) {
  ensureDataDir();
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ==================== 用户操作 ====================

export async function createUser(username: string, password: string, role: string = 'user') {
  const users = readJsonFile(USERS_FILE);
  if (users.find((u: any) => u.username === username && !u.deletedAt)) {
    throw new Error('用户名已存在');
  }

  const user = {
    id: uuidv4(),
    username,
    password,
    role,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeJsonFile(USERS_FILE, users);
  return user;
}

export async function getUserByUsername(username: string) {
  const users = readJsonFile(USERS_FILE);
  return users.find((u: any) => u.username === username && !u.deletedAt) || null;
}

export async function getUserById(id: string) {
  const users = readJsonFile(USERS_FILE);
  return users.find((u: any) => u.id === id) || null;
}

export async function getAllUsers() {
  const users = readJsonFile(USERS_FILE);
  return users.filter((u: any) => !u.deletedAt);
}

export async function softDeleteUser(id: string) {
  const users = readJsonFile(USERS_FILE);
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    users[index].deletedAt = new Date().toISOString();
    writeJsonFile(USERS_FILE, users);
  }
}

export async function getDeletedUsers() {
  const users = readJsonFile(USERS_FILE);
  return users.filter((u: any) => u.deletedAt);
}

export async function restoreUser(id: string) {
  const users = readJsonFile(USERS_FILE);
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    delete users[index].deletedAt;
    writeJsonFile(USERS_FILE, users);
  }
}

export async function deleteUser(id: string) {
  const users = readJsonFile(USERS_FILE);
  const filtered = users.filter((u: any) => u.id !== id);
  writeJsonFile(USERS_FILE, filtered);
}

export async function permanentlyDeleteUser(id: string) {
  await deleteUser(id);
}

export async function resetUserPassword(id: string, newPassword: string) {
  const users = readJsonFile(USERS_FILE);
  const index = users.findIndex((u: any) => u.id === id);
  if (index !== -1) {
    const bcrypt = require('bcryptjs');
    users[index].password = bcrypt.hashSync(newPassword, 10);
    writeJsonFile(USERS_FILE, users);
    return true;
  }
  return false;
}

// ==================== 项目操作 ====================

export async function createProject(data: { projectName: string; projectManager: string; projectNumber: string; userId: string; template?: string }) {
  const projects = readJsonFile(PROJECTS_FILE);
  const project = {
    id: uuidv4(),
    projectName: data.projectName,
    projectManager: data.projectManager,
    projectNumber: data.projectNumber,
    userId: data.userId,
    template: data.template || 'general',
    selectedProducts: [],
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.push(project);
  writeJsonFile(PROJECTS_FILE, projects);
  return project;
}

export async function getProjectsByUserId(userId: string) {
  const projects = readJsonFile(PROJECTS_FILE);
  return projects
    .filter((p: any) => p.userId === userId && !p.deleted)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProjectById(id: string) {
  const projects = readJsonFile(PROJECTS_FILE);
  return projects.find((p: any) => p.id === id) || null;
}

export async function updateProject(id: string, data: { projectName?: string; projectManager?: string; projectNumber?: string; selectedProducts?: string[] }) {
  const projects = readJsonFile(PROJECTS_FILE);
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    if (data.projectName) projects[index].projectName = data.projectName;
    if (data.projectManager) projects[index].projectManager = data.projectManager;
    if (data.projectNumber) projects[index].projectNumber = data.projectNumber;
    if (data.selectedProducts) projects[index].selectedProducts = data.selectedProducts;
    projects[index].updatedAt = new Date().toISOString();
    writeJsonFile(PROJECTS_FILE, projects);
    return projects[index];
  }
  return null;
}

export async function getAllProjects() {
  const projects = readJsonFile(PROJECTS_FILE);
  return projects
    .filter((p: any) => !p.deleted)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllProjectsIncludingDeleted() {
  const projects = readJsonFile(PROJECTS_FILE);
  return projects.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function softDeleteProject(id: string) {
  const projects = readJsonFile(PROJECTS_FILE);
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    projects[index].deleted = true;
    projects[index].deletedAt = new Date().toISOString();
    writeJsonFile(PROJECTS_FILE, projects);
  }
}

export async function getDeletedProjects() {
  const projects = readJsonFile(PROJECTS_FILE);
  return projects
    .filter((p: any) => p.deleted)
    .sort((a: any, b: any) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
}

export async function restoreProject(id: string) {
  const projects = readJsonFile(PROJECTS_FILE);
  const index = projects.findIndex((p: any) => p.id === id);
  if (index !== -1) {
    projects[index].deleted = false;
    delete projects[index].deletedAt;
    writeJsonFile(PROJECTS_FILE, projects);
  }
}

export async function deleteProject(id: string) {
  const projects = readJsonFile(PROJECTS_FILE);
  const filtered = projects.filter((p: any) => p.id !== id);
  writeJsonFile(PROJECTS_FILE, filtered);
}

export async function deleteProjectWithFiles(projectId: string) {
  const materials = readJsonFile(MATERIALS_FILE);
  const filteredMaterials = materials.filter((m: any) => m.projectId !== projectId);
  writeJsonFile(MATERIALS_FILE, filteredMaterials);
  await deleteProject(projectId);
}

export async function permanentlyDeleteProject(id: string) {
  await deleteProjectWithFiles(id);
}

// ==================== 材料操作 ====================

export async function createMaterial(data: {
  projectId: string;
  materialName: string;
  materialGroup: string;
  productionLineId?: string;
  isProjectMaterial?: boolean;
}) {
  const materials = readJsonFile(MATERIALS_FILE);
  const material = {
    id: uuidv4(),
    projectId: data.projectId,
    materialName: data.materialName,
    materialGroup: data.materialGroup,
    isProjectMaterial: data.isProjectMaterial || false,
    images: [],
    files: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  materials.push(material);
  writeJsonFile(MATERIALS_FILE, materials);
  return material;
}

export async function getMaterialsByProjectId(projectId: string) {
  const materials = readJsonFile(MATERIALS_FILE);
  return materials.filter((m: any) => m.projectId === projectId);
}

export async function getMaterialById(id: string) {
  const materials = readJsonFile(MATERIALS_FILE);
  return materials.find((m: any) => m.id === id) || null;
}

export async function updateMaterial(id: string, data: { images?: string[]; files?: string[] }) {
  const materials = readJsonFile(MATERIALS_FILE);
  const index = materials.findIndex((m: any) => m.id === id);
  if (index !== -1) {
    if (data.images !== undefined) materials[index].images = data.images;
    if (data.files !== undefined) materials[index].files = data.files;
    materials[index].updatedAt = new Date().toISOString();
    writeJsonFile(MATERIALS_FILE, materials);
    return materials[index];
  }
  return null;
}

export async function getOrCreateMaterial(projectId: string, materialName: string, materialGroup: string, productionLineId?: string, isProjectMaterial?: boolean) {
  const materials = readJsonFile(MATERIALS_FILE);
  const existing = materials.find((m: any) => m.projectId === projectId && m.materialName === materialName && m.materialGroup === materialGroup);
  if (existing) return existing;
  return await createMaterial({ projectId, materialName, materialGroup, productionLineId, isProjectMaterial });
}

export async function batchCreateProductMaterials(projectId: string, productionLineId: string, productId: string, materials: string[]) {
  for (const materialName of materials) {
    await getOrCreateMaterial(projectId, materialName, productId, productionLineId, false);
  }
}

export async function batchCreateProjectMaterials(projectId: string, materials: string[]) {
  for (const materialName of materials) {
    await getOrCreateMaterial(projectId, materialName, 'project', undefined, true);
  }
}

export async function deleteProductMaterials(projectId: string, productId: string) {
  const materials = readJsonFile(MATERIALS_FILE);
  const filtered = materials.filter((m: any) => !(m.projectId === projectId && m.materialGroup === productId));
  writeJsonFile(MATERIALS_FILE, filtered);
}
