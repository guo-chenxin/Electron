import { db } from '../db/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../models';
import { BaseService } from './baseService';
import bcrypt from 'bcryptjs';
import { convertUtcToLocal } from '../utils/dateUtils';

// 用户服务类
export class UserService extends BaseService<User, CreateUserRequest, UpdateUserRequest> {
  protected tableName = 'users';
  protected idField = 'id';



  /**
   * 将数据库字段映射为User对象（处理下划线命名到驼峰命名的转换）
   * @param row 数据库查询结果行
   * @returns 映射后的User对象
   */
  protected mapFields(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      role: row.role,
      createdAt: convertUtcToLocal(row.created_at),
      updatedAt: convertUtcToLocal(row.updated_at)
    } as User;
  }

  /**
   * 根据用户名获取用户
   */
  getUserByUsername(username: string): User | null {
    const sql = `
      SELECT * 
      FROM users
      WHERE username = ?
    `;
    
    const row = db.get<any>(sql, [username]);
    return row ? this.mapFields(row) : null;
  }

  /**
   * 根据邮箱获取用户
   */
  getUserByEmail(email: string): User | null {
    const sql = `
      SELECT * 
      FROM users
      WHERE email = ?
    `;
    
    const row = db.get<any>(sql, [email]);
    return row ? this.mapFields(row) : null;
  }

  // 密码哈希盐值轮数
  private saltRounds = 10;

  /**
   * 哈希密码
   */
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  /**
   * 验证密码
   */
  public verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  /**
   * 创建用户（处理密码哈希和默认值）
   */
  create(userData: CreateUserRequest): User | null {
    const sql = `
      INSERT INTO users (username, email, password, avatar_url, bio, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = db.run(sql, [
      userData.username, 
      userData.email, 
      userData.password ? this.hashPassword(userData.password) : '',
      userData.avatarUrl || null,
      userData.bio || null,
      userData.role || 'user'
    ]);
    
    return this.getById(result.lastID);
  }
}

// 导出单例实例
export const userService = new UserService();
