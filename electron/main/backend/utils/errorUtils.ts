/**
 * 错误处理工具类
 */

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  /**
   * 创建自定义错误
   * @param message 错误信息
   * @param statusCode HTTP状态码
   * @param isOperational 是否为操作错误
   */
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 捕获错误堆栈
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  errorType?: ErrorType;
  stack?: string;
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  /**
   * 创建错误响应
   * @param error 错误对象
   * @param isProduction 是否为生产环境
   * @returns 错误响应对象
   */
  static createErrorResponse(error: any, isProduction: boolean = false): ErrorResponse {
    const statusCode = error.statusCode || 500;
    const status = statusCode >= 500 ? 'error' : 'fail';

    const errorResponse: ErrorResponse = {
      status,
      statusCode,
      message: error.message || 'Internal Server Error'
    };

    // 在非生产环境下，添加错误堆栈
    if (!isProduction && error.stack) {
      errorResponse.stack = error.stack;
    }

    return errorResponse;
  }

  /**
   * 处理验证错误
   * @param message 错误信息
   * @returns 验证错误对象
   */
  static createValidationError(message: string): AppError {
    return new AppError(message, 400);
  }

  /**
   * 处理数据库错误
   * @param message 错误信息
   * @returns 数据库错误对象
   */
  static createDatabaseError(message: string): AppError {
    return new AppError(message, 500);
  }

  /**
   * 处理认证错误
   * @param message 错误信息
   * @returns 认证错误对象
   */
  static createAuthenticationError(message: string): AppError {
    return new AppError(message, 401);
  }

  /**
   * 处理授权错误
   * @param message 错误信息
   * @returns 授权错误对象
   */
  static createAuthorizationError(message: string): AppError {
    return new AppError(message, 403);
  }

  /**
   * 处理资源不存在错误
   * @param message 错误信息
   * @returns 资源不存在错误对象
   */
  static createNotFoundError(message: string): AppError {
    return new AppError(message, 404);
  }

  /**
   * 处理内部服务器错误
   * @param message 错误信息
   * @returns 内部服务器错误对象
   */
  static createInternalError(message: string): AppError {
    return new AppError(message, 500);
  }
}