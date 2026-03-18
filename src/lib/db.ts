import { v4 as uuidv4 } from 'uuid';

// ==================== D1 数据库接口 ====================

function getDB(): D1Database {
  try {
    // Cloudflare Workers 环境：通过 getRequestContext 获取
    const { getRequestContext } = require('@opennextjs/cloudflare');
    const ctx = getRequestContext();
    if (ctx?.env?.DB) return ctx.env.DB;
  } catch {}

  // 全局注入（中间件注入）
  if ((globalThis as any).__D1_DB__) {
    return (globalThis as any).__D1_DB__;
  }

  throw new Error('D1 数据库未初始化，请确认 Cloudflare Workers 环境配置');
}

// ==================== 用户操作 ====================

export async function createUser(username: string, password: string, role: string = 'user') {
  const db = getDB();
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) throw new Error('用户名已存在');

  const id = uuidv4();
  await db.prepare(
    'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)'
  ).bind(id, username, password, role).run();

  return { id, username, password, role, createdAt: new Date().toISOString() };
}

export async function getUserByUsername(username: string) {
  const db = getDB();
  return await db.prepare('SELECT * FROM users WHERE username = ? AND deletedAt IS NULL').bind(username).first();
}

export async function getUserById(id: string) {
  const db = getDB();
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

export async function getAllUsers() {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM users WHERE deletedAt IS NULL ORDER BY createdAt DESC').all();
  return result.results;
}

export async function softDeleteUser(id: string) {
  const db = getDB();
  await db.prepare('UPDATE users SET deletedAt = ? WHERE id = ?').bind(new Date().toISOString(), id).run();
}

export async function getDeletedUsers() {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM users WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC').all();
  return result.results;
}

export async function restoreUser(id: string) {
  const db = getDB();
  await db.prepare('UPDATE users SET deletedAt = NULL WHERE id = ?').bind(id).run();
}

export async function deleteUser(id: string) {
  const db = getDB();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
}

export async function permanentlyDeleteUser(id: string) {
  await deleteUser(id);
}

export async function resetUserPassword(id: string, newPassword: string) {
  const db = getDB();
  const bcrypt = require('bcryptjs');
  const hashed = bcrypt.hashSync(newPassword, 10);
  await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashed, id).run();
  return true;
}

// ==================== 项目操作 ====================

export async function createProject(data: { projectName: string; projectManager: string; projectNumber: string; userId: string; template?: string }) {
  const db = getDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO projects (id, projectName, projectManager, projectNumber, userId, template, selectedProducts, deleted, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)'
  ).bind(id, data.projectName, data.projectManager, data.projectNumber, data.userId, data.template || 'general', '[]', now, now).run();

  return { id, ...data, template: data.template || 'general', selectedProducts: [], deleted: false, createdAt: now, updatedAt: now };
}

export async function getProjectsByUserId(userId: string) {
  const db = getDB();
  const result = await db.prepare(
    'SELECT * FROM projects WHERE userId = ? AND deleted = 0 ORDER BY createdAt DESC'
  ).bind(userId).all();
  return result.results.map(parseProject);
}

export async function getProjectById(id: string) {
  const db = getDB();
  const row = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return row ? parseProject(row) : null;
}

export async function updateProject(id: string, data: { projectName?: string; projectManager?: string; projectNumber?: string; selectedProducts?: string[] }) {
  const db = getDB();
  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const values: any[] = [now];

  if (data.projectName) { sets.push('projectName = ?'); values.push(data.projectName); }
  if (data.projectManager) { sets.push('projectManager = ?'); values.push(data.projectManager); }
  if (data.projectNumber) { sets.push('projectNumber = ?'); values.push(data.projectNumber); }
  if (data.selectedProducts) { sets.push('selectedProducts = ?'); values.push(JSON.stringify(data.selectedProducts)); }

  values.push(id);
  await db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
  return await getProjectById(id);
}

export async function getAllProjects() {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM projects WHERE deleted = 0 ORDER BY createdAt DESC').all();
  return result.results.map(parseProject);
}

export async function getAllProjectsIncludingDeleted() {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all();
  return result.results.map(parseProject);
}

export async function softDeleteProject(id: string) {
  const db = getDB();
  await db.prepare('UPDATE projects SET deleted = 1, deletedAt = ? WHERE id = ?').bind(new Date().toISOString(), id).run();
}

export async function getDeletedProjects() {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM projects WHERE deleted = 1 ORDER BY deletedAt DESC').all();
  return result.results.map(parseProject);
}

export async function restoreProject(id: string) {
  const db = getDB();
  await db.prepare('UPDATE projects SET deleted = 0, deletedAt = NULL WHERE id = ?').bind(id).run();
}

export async function deleteProject(id: string) {
  const db = getDB();
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
}

export async function deleteProjectWithFiles(projectId: string) {
  const db = getDB();
  await db.prepare('DELETE FROM materials WHERE projectId = ?').bind(projectId).run();
  await deleteProject(projectId);
}

export async function permanentlyDeleteProject(id: string) {
  await deleteProjectWithFiles(id);
}

// ==================== 材料操作 ====================

function parseProject(row: any) {
  return {
    ...row,
    deleted: row.deleted === 1,
    selectedProducts: (() => { try { return JSON.parse(row.selectedProducts || '[]'); } catch { return []; } })()
  };
}

function parseMaterial(row: any) {
  return {
    ...row,
    isProjectMaterial: row.isProjectMaterial === 1,
    images: (() => { try { return JSON.parse(row.images || '[]'); } catch { return []; } })(),
    files: (() => { try { return JSON.parse(row.files || '[]'); } catch { return []; } })()
  };
}

export async function createMaterial(data: {
  projectId: string;
  materialName: string;
  materialGroup: string;
  productionLineId?: string;
  isProjectMaterial?: boolean;
}) {
  const db = getDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  await db.prepare(
    'INSERT INTO materials (id, projectId, materialName, materialGroup, isProjectMaterial, images, files, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, data.projectId, data.materialName, data.materialGroup, data.isProjectMaterial ? 1 : 0, '[]', '[]', now, now).run();

  return { id, ...data, isProjectMaterial: data.isProjectMaterial || false, images: [], files: [], createdAt: now, updatedAt: now };
}

export async function getMaterialsByProjectId(projectId: string) {
  const db = getDB();
  const result = await db.prepare('SELECT * FROM materials WHERE projectId = ?').bind(projectId).all();
  return result.results.map(parseMaterial);
}

export async function getMaterialById(id: string) {
  const db = getDB();
  const row = await db.prepare('SELECT * FROM materials WHERE id = ?').bind(id).first();
  return row ? parseMaterial(row) : null;
}

export async function updateMaterial(id: string, data: { images?: string[]; files?: string[] }) {
  const db = getDB();
  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const values: any[] = [now];

  if (data.images !== undefined) { sets.push('images = ?'); values.push(JSON.stringify(data.images)); }
  if (data.files !== undefined) { sets.push('files = ?'); values.push(JSON.stringify(data.files)); }

  values.push(id);
  await db.prepare(`UPDATE materials SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
  return await getMaterialById(id);
}

export async function getOrCreateMaterial(projectId: string, materialName: string, materialGroup: string, productionLineId?: string, isProjectMaterial?: boolean) {
  const db = getDB();
  const existing = await db.prepare(
    'SELECT * FROM materials WHERE projectId = ? AND materialName = ? AND materialGroup = ?'
  ).bind(projectId, materialName, materialGroup).first();

  if (existing) return parseMaterial(existing);
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
  const db = getDB();
  await db.prepare('DELETE FROM materials WHERE projectId = ? AND materialGroup = ?').bind(projectId, productId).run();
}
