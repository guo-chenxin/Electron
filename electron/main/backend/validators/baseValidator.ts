/**
 * 验证器基础功能
 */
import Joi from 'joi';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
}

/**
 * 验证器基类
 */
export class Validator {
  /**
   * 验证数据
   * @param data 要验证的数据
   * @param schema Joi验证模式
   * @returns 验证结果
   */
  static validate<T>(data: any, schema: Joi.Schema): ValidationResult {
    const result = schema.validate(data, { abortEarly: false });
    
    if (result.error) {
      return {
        isValid: false,
        error: result.error.details.map(detail => detail.message).join(', ')
      };
    }
    
    return {
      isValid: true,
      data: result.value as T
    };
  }
}