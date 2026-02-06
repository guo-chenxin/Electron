// 使用ES模块语法导入
import path from 'node:path';
import { app } from 'electron';
import { sqlManager } from './sql/sqlManager';

// 获取数据库文件路径
const getDatabasePath = () => {
  try {
    // 选项1：优先使用用户数据目录（最可靠，适合生产环境）
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'app.db');
  } catch (error) {
    console.error('Failed to get user data path:', error);
    
    // 选项2：使用应用根目录作为备选
    if (process.env.APP_ROOT) {
      return path.join(process.env.APP_ROOT, 'app.db');
    }
    
    // 选项3：最终备选，使用当前工作目录
    return path.join(process.cwd(), 'app.db');
  }
};

// 数据库连接类
export class AppDatabase {
  private static instance: AppDatabase;
  private db: any = null;
  
  private constructor() {
    // 私有构造函数，单例模式
  }

  // 获取单例实例
  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  // 连接数据库
  public async connect(): Promise<void> {
    try {
      // 动态导入better-sqlite3模块
      const Database = (await import('better-sqlite3')).default;
      const dbPath = getDatabasePath();
      
      // 使用better-sqlite3的同步连接方式
      this.db = new Database(dbPath, {
        verbose: console.log, // 启用日志
        timeout: 5000 // 超时时间
      });
      
      console.log('Connected to SQLite database at:', dbPath);
    } catch (error: any) {
      console.error('Failed to connect to database:', error);
      // 不抛出错误，允许API路由初始化
    }
  }

  // 初始化数据库（创建表）
  public async initialize(): Promise<void> {
    if (!this.db) {
      await this.connect();
    }

    // 检查数据库是否成功连接
    if (!this.db) {
      console.error('Failed to initialize database: Database not connected');
      // 不抛出错误，允许API路由初始化
      return;
    }

    try {
      // 加载初始化SQL语句
      const createTablesSQL = sqlManager.loadInitSql();
      
      // 执行创建表语句
      // 使用CREATE TABLE IF NOT EXISTS，确保表不存在时才创建
      this.db.exec(createTablesSQL);
      
      console.log('Database tables initialized successfully');

    } catch (err: any) {
      console.error('Failed to initialize database tables:', err.message);
    }
  }

  // 获取数据库连接
  public getDB(): any {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // 关闭数据库连接
  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        console.log('Database connection closed');
        this.db = null;
      } catch (err: any) {
        console.error('Failed to close database:', err.message);
      }
    }
  }

  // 执行SQL查询
  public run(sql: string, params: any[] = []): { lastID: number; changes: number } {
    // 检查数据库是否成功连接
    if (!this.db) {
      throw new Error('Failed to run SQL query: Database not connected');
    }

    // 使用better-sqlite3的run方法，使用展开运算符传递参数
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    
    return {
      lastID: result.lastInsertRowid,
      changes: result.changes
    };
  }

  // 执行单个查询
  public get<T>(sql: string, params: any[] = []): T | null {
    // 检查数据库是否成功连接
    if (!this.db) {
      throw new Error('Failed to get SQL query: Database not connected');
    }

    // 使用better-sqlite3的get方法，使用展开运算符传递参数
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params) as T | null;
    
    return result;
  }

  // 执行多个查询
  public all<T>(sql: string, params: any[] = []): T[] {
    // 检查数据库是否成功连接
    if (!this.db) {
      throw new Error('Failed to all SQL query: Database not connected');
    }

    // 使用better-sqlite3的all方法，使用展开运算符传递参数
    const stmt = this.db.prepare(sql);
    const result = stmt.all(...params) as T[];
    
    return result;
  }
}

// 导出单例实例的便捷访问方式
export const db = AppDatabase.getInstance();