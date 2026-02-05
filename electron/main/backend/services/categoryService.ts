import { db } from '../db/database';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models';
import { BaseService } from './baseService';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';

// 分类服务类
export class CategoryService extends BaseService<Category, CreateCategoryRequest, UpdateCategoryRequest> {
  protected tableName = 'categories';
  protected idField = 'id';

  /**
   * 验证分类数据
   * @param data 分类数据
   */
  private validateCategoryData(data: CreateCategoryRequest | UpdateCategoryRequest): void {
    if ('name' in data && !data.name) {
      throw new Error('Category name is required');
    }
    
    if ('name' in data && data.name && data.name.length < 2) {
      throw new Error('Category name must be at least 2 characters');
    }
  }

  /**
   * 验证分类名称唯一性
   * @param name 分类名称
   * @param excludeId 排除的分类ID（用于更新操作）
   */
  private validateCategoryNameUnique(name: string, excludeId?: number): void {
    const sql = excludeId 
      ? `SELECT id FROM categories WHERE name = ? AND id != ?`
      : `SELECT id FROM categories WHERE name = ?`;
    
    const params = excludeId ? [name, excludeId] : [name];
    const existingCategory = db.get<any>(sql, params);
    
    if (existingCategory) {
      throw new Error('Category name already exists');
    }
  }

  /**
   * 将数据库字段映射为Category对象
   * @param row 数据库查询结果行
   * @returns 映射后的Category对象
   */
  private mapCategoryFields(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: convertUtcToLocal(row.createdAt || row.created_at),
      updatedAt: convertUtcToLocal(row.updatedAt || row.updated_at)
    } as Category;
  }

  /**
   * 构建分类查询SQL
   * @returns 分类查询SQL
   */
  private buildCategoryQuerySql(): string {
    return `
      SELECT 
        id, 
        name, 
        description, 
        created_at as createdAt, 
        updated_at as updatedAt
      FROM categories
    `;
  }

  /**
   * 获取所有分类
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 分类数组
   */
  getAll(limit: number = 100, offset: number = 0): Category[] {
    const sql = this.buildCategoryQuerySql() + `
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;
    
    const categories = db.all<any>(sql, [limit, offset]);
    return categories.map(category => this.mapCategoryFields(category));
  }

  /**
   * 根据ID获取分类
   * @param id 分类ID
   * @returns 分类对象或null
   */
  getById(id: number): Category | null {
    const sql = this.buildCategoryQuerySql() + `
      WHERE id = ?
    `;
    
    const category = db.get<any>(sql, [id]);
    return category ? this.mapCategoryFields(category) : null;
  }

  /**
   * 根据名称获取分类
   * @param name 分类名称
   * @returns 分类对象或null
   */
  getCategoryByName(name: string): Category | null {
    const sql = this.buildCategoryQuerySql() + `
      WHERE name = ?
    `;
    
    const category = db.get<any>(sql, [name]);
    return category ? this.mapCategoryFields(category) : null;
  }

  /**
   * 获取分类统计信息
   * @returns 分类统计信息数组
   */
  getCategoryStatistics(): { categoryId: number; categoryName: string; articleCount: number }[] {
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
    
    return db.all(sql);
  }

  /**
   * 创建分类
   * @param data 创建分类的请求数据
   * @returns 创建的分类对象
   */
  create(data: CreateCategoryRequest): Category | null {
    // 验证分类数据
    this.validateCategoryData(data);
    
    // 验证分类名称唯一性
    this.validateCategoryNameUnique(data.name);
    
    const sql = `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `;
    
    try {
      const result = db.run(sql, [
        data.name,
        data.description || null
      ]);
      
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to create category:', error.message);
      throw error;
    }
  }

  /**
   * 更新分类
   * @param id 分类ID
   * @param data 更新分类的请求数据
   * @returns 更新后的分类对象
   */
  update(id: number, data: UpdateCategoryRequest): Category | null {
    // 验证分类数据
    this.validateCategoryData(data);
    
    // 验证分类名称唯一性（如果更新了名称）
    if ('name' in data && data.name) {
      this.validateCategoryNameUnique(data.name, id);
    }
    
    const sql = `
      UPDATE categories
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        updated_at = ?
      WHERE id = ?
    `;
    
    try {
      db.run(sql, [
        data.name,
        data.description,
        getCurrentLocalTimeForSqlite(),
        id
      ]);
      
      return this.getById(id);
    } catch (error: any) {
      console.error('Failed to update category:', error.message);
      throw error;
    }
  }
}

// 导出单例实例
export const categoryService = new CategoryService();
