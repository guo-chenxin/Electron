/**
 * 文章模型接口
 */
export interface Article {
  id: number;
  title: string;
  content: string;
  summary?: string;
  authorId: number;
  categoryId?: number;
  tags?: string;
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}