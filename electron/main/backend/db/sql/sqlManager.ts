import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * SQL管理器类
 * 用于加载和管理SQL语句文件
 */
export class SqlManager {
  private static instance: SqlManager;
  private sqlCache: Map<string, string> = new Map();
  private baseDir: string;

  private constructor() {
    // 私有构造函数，单例模式
    // 在ES模块中获取当前文件目录
    const __filename = fileURLToPath(import.meta.url);
    this.baseDir = path.dirname(__filename);
  }

  /**
   * 获取SQL管理器实例
   */
  public static getInstance(): SqlManager {
    if (!SqlManager.instance) {
      SqlManager.instance = new SqlManager();
    }
    return SqlManager.instance;
  }

  /**
   * 加载SQL文件
   * @param fileName SQL文件名
   * @returns SQL文件内容
   */
  private loadSqlFile(fileName: string): string {
    const cacheKey = fileName;
    
    // 检查是否已经缓存
    if (this.sqlCache.has(cacheKey)) {
      return this.sqlCache.get(cacheKey)!;
    }

    try {
      // 构建SQL文件路径
      const filePath = path.join(this.baseDir, fileName);
      
      // 读取SQL文件内容
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // 缓存SQL文件内容
      this.sqlCache.set(cacheKey, sqlContent);
      
      console.log(`Loaded SQL file: ${filePath}`);
      return sqlContent;
    } catch (error) {
      console.error(`Failed to load SQL file: ${fileName}`, error);
      throw error;
    }
  }

  /**
   * 加载初始化SQL文件
   * @returns 初始化SQL语句
   */
  public loadInitSql(): string {
    return this.loadSqlFile('init.sql');
  }

  /**
   * 清除缓存的SQL文件
   */
  public clearCache(): void {
    this.sqlCache.clear();
    console.log('Cleared SQL cache');
  }
}

// 导出单例实例
export const sqlManager = SqlManager.getInstance();
