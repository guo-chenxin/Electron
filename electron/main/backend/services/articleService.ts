import { db } from '../db/database';
import { Article, CreateArticleRequest, UpdateArticleRequest } from '../models';
import { BaseService } from './baseService';
import { convertUtcToLocal } from '../utils/dateUtils';

// 文章服务类
export class ArticleService extends BaseService<Article, CreateArticleRequest, UpdateArticleRequest> {
  protected tableName = 'articles';
  protected idField = 'id';

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

  // 获取所有文章（覆盖父类方法以返回正确的字段映射）
  getAll(limit: number = 100, offset: number = 0): Article[] {
    const sql = `
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
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据ID获取文章（覆盖父类方法以返回正确的字段映射）
  getById(id: number): Article | null {
    const sql = `
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
      WHERE id = ?
    `;
    
    const article = db.get<Article>(sql, [id]);
    return article ? this.convertArticleTimestamps(article) : null;
  }

  // 根据作者ID获取文章
  getArticlesByAuthorId(authorId: number, limit: number = 100, offset: number = 0): Article[] {
    const sql = `
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
      WHERE author_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [authorId, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据分类ID获取文章
  getArticlesByCategoryId(categoryId: number, limit: number = 100, offset: number = 0): Article[] {
    const sql = `
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
      WHERE category_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [categoryId, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 根据状态获取文章
  getArticlesByStatus(status: 'draft' | 'published' | 'archived', limit: number = 100, offset: number = 0): Article[] {
    const sql = `
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
      WHERE status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const articles = db.all<Article>(sql, [status, limit, offset]);
    return articles.map(article => this.convertArticleTimestamps(article));
  }

  // 增加文章浏览量
  incrementViewCount(id: number): boolean {
    const sql = `
      UPDATE articles
      SET view_count = view_count + 1
      WHERE id = ?
    `;
    
    const result = db.run(sql, [id]);
    
    return result.changes > 0;
  }
}

// 导出单例实例
export const articleService = new ArticleService();
