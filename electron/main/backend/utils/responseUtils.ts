/**
 * API响应工具类
 */

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  status: string;
  statusCode: number;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages?: number;
  };
}

/**
 * 分页选项接口
 */
export interface PaginationOptions {
  total: number;
  limit: number;
  offset: number;
  pages?: number;
}

/**
 * API响应工具类
 */
export class ResponseHandler {
  /**
   * 创建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @param statusCode HTTP状态码
   * @param pagination 分页信息
   * @returns 成功响应对象
   */
  static createSuccessResponse<T = any>(data?: T, message: string = '操作成功', statusCode: number = 200, pagination?: PaginationOptions): ApiResponse<T> {
    const response: ApiResponse<T> = {
      status: 'success',
      statusCode,
      message
    };

    if (data !== undefined) {
      response.data = data;
    }

    if (pagination) {
      response.pagination = pagination;
    }

    return response;
  }

  /**
   * 创建错误响应
   * @param message 错误消息
   * @param statusCode HTTP状态码
   * @returns 错误响应对象
   */
  static createErrorResponse(message: string = '操作失败', statusCode: number = 400): ApiResponse {
    return {
      status: 'error',
      statusCode,
      message
    };
  }

  /**
   * 创建分页响应
   * @param data 响应数据
   * @param pagination 分页信息
   * @param message 响应消息
   * @returns 分页响应对象
   */
  static createPaginationResponse<T = any>(data: T, pagination: PaginationOptions, message: string = '操作成功'): ApiResponse<T> {
    return this.createSuccessResponse(data, message, 200, pagination);
  }

  /**
   * 创建创建成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 创建成功响应对象
   */
  static createCreatedResponse<T = any>(data?: T, message: string = '创建成功'): ApiResponse<T> {
    return this.createSuccessResponse(data, message, 201);
  }

  /**
   * 创建更新成功响应
   * @param data 响应数据
   * @param message 响应消息
   * @returns 更新成功响应对象
   */
  static createUpdatedResponse<T = any>(data?: T, message: string = '更新成功'): ApiResponse<T> {
    return this.createSuccessResponse(data, message, 200);
  }

  /**
   * 创建删除成功响应
   * @param message 响应消息
   * @returns 删除成功响应对象
   */
  static createDeletedResponse(message: string = '删除成功'): ApiResponse {
    return this.createSuccessResponse(undefined, message, 200);
  }

  /**
   * 创建未找到响应
   * @param message 响应消息
   * @returns 未找到响应对象
   */
  static createNotFoundResponse(message: string = '资源不存在'): ApiResponse {
    return this.createErrorResponse(message, 404);
  }

  /**
   * 创建验证错误响应
   * @param message 响应消息
   * @returns 验证错误响应对象
   */
  static createValidationErrorResponse(message: string = '验证失败'): ApiResponse {
    return this.createErrorResponse(message, 400);
  }

  /**
   * 创建认证错误响应
   * @param message 响应消息
   * @returns 认证错误响应对象
   */
  static createAuthenticationErrorResponse(message: string = '认证失败'): ApiResponse {
    return this.createErrorResponse(message, 401);
  }

  /**
   * 创建授权错误响应
   * @param message 响应消息
   * @returns 授权错误响应对象
   */
  static createAuthorizationErrorResponse(message: string = '授权失败'): ApiResponse {
    return this.createErrorResponse(message, 403);
  }

  /**
   * 创建服务器错误响应
   * @param message 响应消息
   * @returns 服务器错误响应对象
   */
  static createServerErrorResponse(message: string = '服务器内部错误'): ApiResponse {
    return this.createErrorResponse(message, 500);
  }
}