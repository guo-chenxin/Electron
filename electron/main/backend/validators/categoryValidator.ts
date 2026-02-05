// 分类相关验证器
import Joi from 'joi';
import { Validator, ValidationResult } from './baseValidator';

// 分类验证器类
export class CategoryValidator {
  // 创建分类请求验证
  static validateCreateCategory(data: any): ValidationResult {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required().messages({
        'string.min': '分类名称长度不能少于2位',
        'string.max': '分类名称长度不能超过50位',
        'any.required': '分类名称不能为空'
      }),
      description: Joi.string().max(200).optional().messages({
        'string.max': '分类描述长度不能超过200位'
      })
    });
    
    return Validator.validate(data, schema);
  }
  
  // 更新分类请求验证
  static validateUpdateCategory(data: any): ValidationResult {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).optional().messages({
        'string.min': '分类名称长度不能少于2位',
        'string.max': '分类名称长度不能超过50位'
      }),
      description: Joi.string().max(200).optional().messages({
        'string.max': '分类描述长度不能超过200位'
      })
    });
    
    return Validator.validate(data, schema);
  }
}