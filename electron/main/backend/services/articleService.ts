import { db } from '../db/database';
import { Article, CreateArticleRequest, UpdateArticleRequest } from '../models';
import { BaseService } from './baseService';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';

// 文章服务类
export class ArticleService extends BaseService<Article, CreateArticleRequest, UpdateArticleRequest> {
  protected tableName = 'articles';
  protected idField = 'id';

  /**
   * 验证文章数据
   * @param data 文章数据
   */
  private validateArticleData(data: CreateArticleRequest | UpdateArticleRequest): void {
    if ('title' in data && !data.title) {
      throw new Error('Title is required');
    }
    
    if ('content' in data && !data.content) {
      throw new Error('Content is required');
    }
    
    if ('authorId' in data && !data.authorId) {
      throw new Error('Author ID is required');
    }
  }

  /**
   * 转换文章对象中的时间戳
   * @param article 文章对象
   * @returns 转换后的文章对象
   */
  private convertArticleTimestamps(article: Article): Article {
    return {
      ...article,
      createdAt: convertUtcToLocal(article.createdAt as string),
      updatedAt: convertUtcToLocal(article.updatedAt as string)
    };
  }

  /**
   * 构建文章查询SQL
   * @returns 文章查询SQL
   */
  private buildArticleQuerySql(): string {
    return `
      SELECT 
        id, 
        title, 
        content, 
        summary, 
        author_id as authorId, 
        category_id as categoryId,
        tags,
        status,
        view_count as viewCount,
        created_at as createdAt,
        updated_at as updatedAt
      FROM articles
    `;
  }

  // 获取所有文章（覆盖父类方法以返回正确的字段映射）
  getAll(limit: number = 100, offset: number = 0): Article[] {
    const sql = this.buildArticleQuerySql() + `
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据ID获取文章（覆盖父类方法以返回正确的字段映射）
  getById(id: number): Article | null {
    const sql = this.buildArticleQuerySql() + `
      WHERE id = ?
    `;
    
    const article = db.get<Article>(sql, [id]);
    return article ? this.convertArticleTimestamps(article) : null;
  }

  // 根据作者ID获取文章
  getArticlesByAuthorId(authorId: number, limit: number = 100, offset: number = 0): Article[] {
    const sql = this.buildArticleQuerySql() + `
      WHERE author_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [authorId, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据分类ID获取文章
  getArticlesByCategoryId(categoryId: number, limit: number = 100, offset: number = 0): Article[] {
    const sql = this.buildArticleQuerySql() + `
      WHERE category_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [categoryId, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据状态获取文章
  getArticlesByStatus(status: 'draft' | 'published' | 'archived', limit: number = 100, offset: number = 0): Article[] {
    const sql = this.buildArticleQuerySql() + `
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [status, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  /**
   * 创建文章
   * @param data 创建文章的请求数据
   * @returns 创建的文章对象
   */
  create(data: CreateArticleRequest): Article | null {
    // 验证文章数据
    this.validateArticleData(data);
    
    const sql = `
      INSERT INTO articles (
        title, content, summary, author_id, category_id, tags, status, view_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 准备参数，处理可选字段
    const params = [
      data.title,
      data.content,
      data.summary || null,
      data.authorId,
      data.categoryId || null,
      data.tags || null,
      data.status || 'draft',
      0 // 初始浏览量为0
    ];
    
    try {
      const result = db.run(sql, params);
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to create article:', error.message);
      throw error;
    }
  }

  /**
   * 更新文章
   * @param id 文章ID
   * @param data 更新文章的请求数据
   * @returns 更新后的文章对象
   */
  update(id: number, data: UpdateArticleRequest): Article | null {
    // 验证文章数据
    this.validateArticleData(data);
    
    const sql = `
      UPDATE articles
      SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        summary = COALESCE(?, summary),
        category_id = COALESCE(?, category_id),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `;
    
    const params = [
      data.title,
      data.content,
      data.summary,
      data.categoryId,
      data.tags,
      data.status,
      getCurrentLocalTimeForSqlite(),
      id
    ];
    
    try {
      db.run(sql, params);
      return this.getById(id);
    } catch (error: any) {
      console.error('Failed to update article:', error.message);
      throw error;
    }
  }

  /**
   * 增加文章浏览量
   * @param id 文章ID
   * @returns 是否增加成功
   */
  incrementViewCount(id: number): boolean {
    const sql = `
      UPDATE articles
      SET view_count = view_count + 1
      WHERE id = ?
    `;
    
    try {
      const result = db.run(sql, [id]);
      return result.changes > 0;
    } catch (error: any) {
      console.error('Failed to increment view count:', error.message);
      return false;
    }
  }
}

// 导出单例实例
export const articleService = new ArticleService();
