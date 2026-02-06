import { db } from '../db/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../models';
import { BaseService } from './baseService';
import bcrypt from 'bcryptjs';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';

// 用户服务类
export class UserService extends BaseService<User, CreateUserRequest, UpdateUserRequest> {
  protected tableName = 'users';
  protected idField = 'id';

  // 密码哈希盐值轮数
  private saltRounds = 10;

  /**
   * 验证用户数据
   * @param data 用户数据
   */
  private validateUserData(data: CreateUserRequest | UpdateUserRequest): void {
    if ('username' in data && !data.username) {
      throw new Error('Username is required');
    }
    
    if ('email' in data && !data.email) {
      throw new Error('Email is required');
    }
    
    if ('password' in data && data.password && data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }

  /**
   * 验证用户名唯一性
   * @param username 用户名
   * @param excludeId 排除的用户ID（用于更新操作）
   */
  private validateUsernameUnique(username: string, excludeId?: number): void {
    const sql = excludeId 
      ? `SELECT id FROM users WHERE username = ? AND id != ?`
      : `SELECT id FROM users WHERE username = ?`;
    
    const params = excludeId ? [username, excludeId] : [username];
    const existingUser = db.get<any>(sql, params);
    
    if (existingUser) {
      throw new Error('Username already exists');
    }
  }



  /**
   * 验证邮箱唯一性
   * @param email 邮箱
   * @param excludeId 排除的用户ID（用于更新操作）
   */
  private validateEmailUnique(email: string, excludeId?: number): void {
    const sql = excludeId 
      ? `SELECT id FROM users WHERE email = ? AND id != ?`
      : `SELECT id FROM users WHERE email = ?`;
    
    const params = excludeId ? [email, excludeId] : [email];
    const existingUser = db.get<any>(sql, params);
    
    if (existingUser) {
      throw new Error('Email already exists');
    }
  }

  /**
   * 哈希密码
   * @param password 明文密码
   * @returns 哈希后的密码
   */
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

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
   * @param username 用户名
   * @returns 用户对象或null
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
   * @param email 邮箱
   * @returns 用户对象或null
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

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 哈希后的密码
   * @returns 密码是否匹配
   */
  public verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  /**
   * 创建用户
   * @param userData 创建用户的请求数据
   * @returns 创建的用户对象
   */
  create(userData: CreateUserRequest): User | null {
    // 验证用户数据
    this.validateUserData(userData);
    
    // 验证用户名唯一性
    this.validateUsernameUnique(userData.username);
    
    // 验证邮箱唯一性
    this.validateEmailUnique(userData.email);
    
    const sql = `
      INSERT INTO users (username, email, password, avatar_url, bio, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const result = db.run(sql, [
        userData.username, 
        userData.email, 
        userData.password ? this.hashPassword(userData.password) : '',
        userData.avatarUrl || null,
        userData.bio || null,
        userData.role || 'user'
      ]);
      
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to create user:', error.message);
      throw error;
    }
  }

  /**
   * 更新用户
   * @param id 用户ID
   * @param userData 更新用户的请求数据
   * @returns 更新后的用户对象
   */
  update(id: number, userData: UpdateUserRequest): User | null {
    // 验证用户数据
    this.validateUserData(userData);
    
    // 验证用户名唯一性（如果更新了用户名）
    if ('username' in userData && userData.username) {
      this.validateUsernameUnique(userData.username, id);
    }
    
    // 验证邮箱唯一性（如果更新了邮箱）
    if ('email' in userData && userData.email) {
      this.validateEmailUnique(userData.email, id);
    }
    
    const sql = `
      UPDATE users
      SET 
        username = COALESCE(?, username),
        email = COALESCE(?, email),
        password = COALESCE(?, password),
        avatar_url = COALESCE(?, avatar_url),
        bio = COALESCE(?, bio),
        role = COALESCE(?, role),
        updated_at = ?
      WHERE id = ?
    `;
    
    try {
      // 处理密码哈希
      const password = 'password' in userData && userData.password 
        ? this.hashPassword(userData.password)
        : null;
      
      db.run(sql, [
        userData.username,
        userData.email,
        password,
        userData.avatarUrl,
        userData.bio,
        userData.role,
        getCurrentLocalTimeForSqlite(),
        id
      ]);
      
      return this.getById(id);
    } catch (error: any) {
      console.error('Failed to update user:', error.message);
      throw error;
    }
  }
}

// 导出单例实例
export const userService = new UserService();
