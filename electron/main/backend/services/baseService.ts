// 基础服务类，提供通用的CRUD操作
import { db } from '../db/database';
import { getCurrentLocalTimeForSqlite } from '../utils/dateUtils';
import { AppError, ErrorHandler } from '../utils/errorUtils';

export abstract class BaseService<T, CreateDto extends Record<string, any>, UpdateDto extends Record<string, any>> {
  protected abstract tableName: string;
  protected abstract idField: string;
  
  /**
   * 将数据库字段映射为DTO字段（用于处理下划线命名到驼峰命名的转换）
   * @param row 数据库查询结果行
   * @returns 映射后的对象
   */
  protected mapFields(row: any): T {
    // 默认实现：直接返回原对象
    // 子类可以覆盖此方法以实现自定义字段映射
    return row as T;
  }
  
  /**
   * 获取所有记录
   */
  getAll(limit: number = 100, offset: number = 0): T[] {
    try {
      const sql = `
        SELECT * 
        FROM ${this.tableName}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = db.all<any>(sql, [limit, offset]);
      return rows.map(row => this.mapFields(row));
    } catch (error) {
      console.error(`Error getting all ${this.tableName}:`, error);
      throw ErrorHandler.createDatabaseError(`获取${this.tableName}列表失败`);
    }
  }
  
  /**
   * 根据ID获取记录
   */
  getById(id: number): T | null {
    try {
      const sql = `
        SELECT * 
        FROM ${this.tableName}
        WHERE ${this.idField} = ?
      `;
      
      const row = db.get<any>(sql, [id]);
      return row ? this.mapFields(row) : null;
    } catch (error) {
      console.error(`Error getting ${this.tableName} by id ${id}:`, error);
      throw ErrorHandler.createDatabaseError(`获取${this.tableName}失败`);
    }
  }
  
  /**
   * 创建记录
   */
  create(data: CreateDto): T | null {
    try {
      // 获取所有非空字段
      const fields = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key]) => key);
      
      const values = fields.map(field => (data as any)[field]);
      const placeholders = fields.map(() => '?').join(', ');
      
      const sql = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders})
      `;
      
      const result = db.run(sql, values);
      
      return this.getById(result.lastID);
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw ErrorHandler.createDatabaseError(`创建${this.tableName}失败`);
    }
  }
  
  /**
   * 更新记录
   */
  update(id: number, data: UpdateDto): T | null {
    try {
      // 获取所有非空字段
      const updates = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key]) => `${key} = ?`);
      
      const values = Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([_, value]) => value);
      
      if (updates.length === 0) {
        return this.getById(id);
      }
      
      // 添加更新时间（使用本地时间而不是UTC时间）
      updates.push('updated_at = ?');
      values.push(getCurrentLocalTimeForSqlite());
      values.push(id);
      
      const sql = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}
        WHERE ${this.idField} = ?
      `;
      
      db.run(sql, values);
      
      return this.getById(id);
    } catch (error) {
      console.error(`Error updating ${this.tableName} with id ${id}:`, error);
      throw ErrorHandler.createDatabaseError(`更新${this.tableName}失败`);
    }
  }
  
  /**
   * 删除记录
   */
  delete(id: number): boolean {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE ${this.idField} = ?`;
      
      const result = db.run(sql, [id]);
      
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting ${this.tableName} with id ${id}:`, error);
      throw ErrorHandler.createDatabaseError(`删除${this.tableName}失败`);
    }
  }
}