-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 用户ID，自增主键
  username TEXT UNIQUE NOT NULL,          -- 用户名，唯一且非空
  email TEXT UNIQUE NOT NULL,             -- 邮箱，唯一且非空
  password TEXT,                          -- 密码，哈希存储
  avatar_url TEXT,                        -- 头像URL
  bio TEXT,                               -- 个人简介
  role TEXT DEFAULT 'user',               -- 角色，默认为普通用户
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 分类ID，自增主键
  name TEXT UNIQUE NOT NULL,              -- 分类名称，唯一且非空
  description TEXT,                       -- 分类描述
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 文章ID，自增主键
  title TEXT NOT NULL,                    -- 文章标题，非空
  content TEXT NOT NULL,                  -- 文章内容，非空
  summary TEXT,                           -- 文章摘要
  author_id INTEGER NOT NULL,             -- 作者ID，关联users表
  category_id INTEGER,                    -- 分类ID，关联categories表
  tags TEXT,                              -- 标签，逗号分隔
  status TEXT DEFAULT 'draft',            -- 状态，默认为草稿
  view_count INTEGER DEFAULT 0,           -- 浏览次数，默认为0
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
  FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,        -- 外键约束，作者删除时级联删除文章
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL  -- 外键约束，分类删除时设为NULL
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 标签ID，自增主键
  name TEXT UNIQUE NOT NULL,              -- 标签名称，唯一且非空
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL,            -- 文章ID，关联articles表
  tag_id INTEGER NOT NULL,                -- 标签ID，关联tags表
  PRIMARY KEY (article_id, tag_id),       -- 复合主键
  FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,  -- 外键约束，文章删除时级联删除
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE           -- 外键约束，标签删除时级联删除
);

-- 路由表
CREATE TABLE IF NOT EXISTS routes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 路由ID，自增主键
  path TEXT NOT NULL UNIQUE,              -- 路由路径，唯一且非空
  name TEXT UNIQUE,                       -- 路由名称，唯一
  component TEXT,                         -- 组件路径
  redirect TEXT,                          -- 重定向路径
  parent_id INTEGER,                      -- 父路由ID，用于嵌套路由
  project_id TEXT,                        -- 项目标识，用于多项目管理
  title TEXT,                             -- 路由标题
  icon TEXT,                              -- 路由图标
  requires_auth INTEGER DEFAULT 1,         -- 是否需要认证（1:是，0:否）
  permission TEXT,                        -- 权限标识
  keep_alive INTEGER DEFAULT 0,            -- 是否缓存组件（1:是，0:否）
  show_in_menu INTEGER DEFAULT 1,           -- 是否显示在菜单中（1:是，0:否）
  show_in_tabs INTEGER DEFAULT 1,           -- 是否显示在标签页中（1:是，0:否）
  "order" INTEGER DEFAULT 0,               -- 菜单显示顺序（使用双引号转义SQL关键字）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
  FOREIGN KEY (parent_id) REFERENCES routes (id) ON DELETE CASCADE  -- 外键约束，父路由删除时级联删除
);

-- 卡片表
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 卡片ID，自增主键
  title TEXT NOT NULL,                    -- 卡片标题，非空
  description TEXT,                       -- 卡片描述
  icon TEXT,                              -- 卡片图标
  route_id INTEGER,                       -- 关联到路由表的ID
  route_path TEXT,                        -- 路由路径（冗余字段，便于快速查询）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 更新时间
  FOREIGN KEY (route_id) REFERENCES routes (id) ON DELETE SET NULL  -- 外键约束，路由删除时设为NULL
);

-- 创建索引
-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);           -- 邮箱索引，加速按邮箱查询
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);       -- 用户名索引，加速按用户名查询

-- 文章表索引
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);  -- 作者ID索引，加速按作者查询
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);  -- 分类ID索引，加速按分类查询
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);    -- 状态索引，加速按状态查询
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);  -- 创建时间索引，加速按时间查询

-- 分类表索引
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);     -- 分类名称索引，加速按名称查询

-- 标签表索引
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);                -- 标签名称索引，加速按名称查询

-- 文章标签关联表索引
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id);  -- 标签ID索引，加速按标签查询文章

-- 路由表索引
CREATE INDEX IF NOT EXISTS idx_routes_parent_id ON routes(parent_id);  -- 父路由ID索引，加速查询子路由
CREATE INDEX IF NOT EXISTS idx_routes_path ON routes(path);            -- 路由路径索引，加速按路径查询
CREATE INDEX IF NOT EXISTS idx_routes_project_id ON routes(project_id);  -- 项目ID索引，加速按项目查询
CREATE INDEX IF NOT EXISTS idx_routes_order ON routes("order");        -- 顺序索引，加速排序

-- 卡片表索引
CREATE INDEX IF NOT EXISTS idx_cards_route_id ON cards(route_id);       -- 路由ID索引，加速按路由查询
CREATE INDEX IF NOT EXISTS idx_cards_route_path ON cards(route_path);   -- 路由路径索引，加速按路径查询
