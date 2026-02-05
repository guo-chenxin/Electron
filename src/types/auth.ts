// 认证相关类型定义

/**
 * 用户信息类型
 */
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 认证状态类型
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * 认证响应类型
 */
export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * 刷新令牌响应类型
 */
export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
}

/**
 * 登录请求类型
 */
export interface LoginRequest {
  email: string;
  code: string;
}

/**
 * 密码登录请求类型
 */
export interface PasswordLoginRequest {
  email: string;
  password: string;
}
