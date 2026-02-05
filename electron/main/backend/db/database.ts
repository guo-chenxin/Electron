// 使用ES模块语法导入
import path from 'path';
import { app } from 'electron';

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

    return new Promise((resolve) => {
      // 检查数据库是否成功连接
      if (!this.db) {
        console.error('Failed to initialize database: Database not connected');
        // 不抛出错误，允许API路由初始化
        resolve();
        return;
      }

      // 创建表的SQL语句
    const createTablesSQL = `
      -- 用户表
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        avatar_url TEXT,
        bio TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 分类表
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 文章表
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        author_id INTEGER NOT NULL,
        category_id INTEGER,
        tags TEXT,
        status TEXT DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
      );
      
      -- 标签表
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 文章标签关联表
      CREATE TABLE IF NOT EXISTS article_tags (
        article_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (article_id, tag_id),
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      );
      
      -- 路由表
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,           -- 路由路径
        name TEXT UNIQUE,                    -- 路由名称
        component TEXT,                      -- 组件路径
        redirect TEXT,                       -- 重定向路径
        parent_id INTEGER,                   -- 父路由ID，用于嵌套路由
        project_id TEXT,                     -- 项目标识，用于多项目管理
        title TEXT,                          -- 路由标题
        icon TEXT,                           -- 路由图标
        requires_auth INTEGER DEFAULT 1,      -- 是否需要认证（1:是，0:否）
        permission TEXT,                     -- 权限标识
        keep_alive INTEGER DEFAULT 0,         -- 是否缓存组件（1:是，0:否）
        show_in_menu INTEGER DEFAULT 1,        -- 是否显示在菜单中（1:是，0:否）
        show_in_tabs INTEGER DEFAULT 1,        -- 是否显示在标签页中（1:是，0:否）
        "order" INTEGER DEFAULT 0,              -- 菜单显示顺序（使用双引号转义SQL关键字）
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES routes (id) ON DELETE CASCADE
      );
      
      -- 卡片表
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        is_favorite INTEGER DEFAULT 0,
        route_id INTEGER,                   -- 关联到路由表的ID
        route_path TEXT,                    -- 路由路径（冗余字段，便于快速查询）
        last_clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE SET NULL
      );
      
      -- 创建索引
      -- 用户表索引
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      
      -- 文章表索引
      CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
      CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
      CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
      
      -- 分类表索引
      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      
      -- 标签表索引
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      
      -- 文章标签关联表索引
      CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);
      
      -- 路由表索引
      CREATE INDEX IF NOT EXISTS idx_routes_parent_id ON routes(parent_id);
      CREATE INDEX IF NOT EXISTS idx_routes_path ON routes(path);
      CREATE INDEX IF NOT EXISTS idx_routes_project_id ON routes(project_id);
      CREATE INDEX IF NOT EXISTS idx_routes_order ON routes("order");
      
      -- 卡片表索引
      CREATE INDEX IF NOT EXISTS idx_cards_is_favorite ON cards(is_favorite);
      CREATE INDEX IF NOT EXISTS idx_cards_last_clicked_at ON cards(last_clicked_at);
      CREATE INDEX IF NOT EXISTS idx_cards_route_id ON cards(route_id);
      CREATE INDEX IF NOT EXISTS idx_cards_route_path ON cards(route_path);
    `;
      
      try {
        // 执行创建表语句
        // 使用CREATE TABLE IF NOT EXISTS，确保表不存在时才创建
        this.db.exec(createTablesSQL);
        
        console.log('Database tables initialized successfully');

      } catch (err: any) {
        console.error('Failed to initialize database tables:', err.message);
      } finally {
        resolve();
      }
    });
  }

  // 获取数据库连接
  public getDB(): any {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  // 关闭数据库连接
  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        try {
          this.db.close();
          console.log('Database connection closed');
          this.db = null;
          resolve();
        } catch (err: any) {
          console.error('Failed to close database:', err.message);
          resolve();
        }
      } else {
        resolve(); // 数据库已经关闭
      }
    });
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