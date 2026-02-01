import { db } from '../db/database';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models';
import { BaseService } from './baseService';

// 分类服务类
export class CategoryService extends BaseService<Category, CreateCategoryRequest, UpdateCategoryRequest> {
  protected tableName = 'categories';
  protected idField = 'id';

  // 获取所有分类（覆盖父类方法以返回正确的字段映射和排序）
  async getAll(): Promise<Category[]> {
    const sql = `
      SELECT 
        id, 
        name, 
        description, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM categories
      ORDER BY name ASC
    `;
    
    return await db.all<Category>(sql);
  }

  // 根据ID获取分类（覆盖父类方法以返回正确的字段映射）
  async getById(id: number): Promise<Category | null> {
    const sql = `
      SELECT 
        id, 
        name, 
        description, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM categories
      WHERE id = ?
    `;
    
    return await db.get<Category>(sql, [id]);
  }

  // 根据名称获取分类
  async getCategoryByName(name: string): Promise<Category | null> {
    const sql = `
      SELECT 
        id, 
        name, 
        description, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM categories
      WHERE name = ?
    `;
    
    return await db.get<Category>(sql, [name]);
  }

  // 获取分类统计信息
  async getCategoryStatistics(): Promise<{ categoryId: number; categoryName: string; articleCount: number }[]> {
    const sql = `
      SELECT 
        c.id as categoryId, 
        c.name as categoryName, 
        COUNT(a.id) as articleCount
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id, c.name
      ORDER BY articleCount DESC, categoryName ASC
    `;
    
    return await db.all(sql);
  }
}

// 导出单例实例
export const categoryService = new CategoryService();
