/**
 * 验证器统一导出文件
 */

// 导出基础验证器功能
export type { ValidationResult } from './baseValidator';
export { Validator } from './baseValidator';

// 导出用户验证器
export { UserValidator } from './userValidator';
export type { LoginRequest, PasswordLoginRequest } from './userValidator';