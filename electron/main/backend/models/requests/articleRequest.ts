/**
 * 创建文章请求接口
 */
export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  authorId: number;
  categoryId?: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
}

/**
 * 更新文章请求接口
 */
export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  summary?: string;
  categoryId?: number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
}