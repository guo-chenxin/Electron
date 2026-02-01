/**
 * 用户模型接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}