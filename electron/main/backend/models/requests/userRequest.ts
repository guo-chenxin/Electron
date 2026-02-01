/**
 * 创建用户请求接口
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
}

/**
 * 更新用户请求接口
 */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
}