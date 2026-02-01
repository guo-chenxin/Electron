/**
 * 创建分类请求接口
 */
export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

/**
 * 更新分类请求接口
 */
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}