/**
 * 标签模型接口
 */
export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

/**
 * 文章标签关联接口
 */
export interface ArticleTag {
  articleId: number;
  tagId: number;
}