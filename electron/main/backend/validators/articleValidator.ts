// 文章相关验证器
import Joi from 'joi';
import { Validator, ValidationResult } from './baseValidator';

// 文章验证器类
export class ArticleValidator {
  // 创建文章请求验证
  static validateCreateArticle(data: any): ValidationResult {
    const schema = Joi.object({
      title: Joi.string().min(2).max(100).required().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过100位',
        'any.required': '标题不能为空'
      }),
      content: Joi.string().required().messages({
        'any.required': '内容不能为空'
      }),
      summary: Joi.string().max(500).optional().messages({
        'string.max': '摘要长度不能超过500位'
      }),
      authorId: Joi.number().integer().positive().required().messages({
        'number.integer': '作者ID必须是整数',
        'number.positive': '作者ID必须是正数',
        'any.required': '作者ID不能为空'
      }),
      categoryId: Joi.number().integer().positive().optional().messages({
        'number.integer': '分类ID必须是整数',
        'number.positive': '分类ID必须是正数'
      }),
      tags: Joi.string().max(200).optional().messages({
        'string.max': '标签长度不能超过200位'
      }),
      status: Joi.string().valid('draft', 'published', 'archived').optional().default('draft').messages({
        'any.only': '状态只能是draft、published或archived'
      })
    });
    
    return Validator.validate(data, schema);
  }
  
  // 更新文章请求验证
  static validateUpdateArticle(data: any): ValidationResult {
    const schema = Joi.object({
      title: Joi.string().min(2).max(100).optional().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过100位'
      }),
      content: Joi.string().optional(),
      summary: Joi.string().max(500).optional().messages({
        'string.max': '摘要长度不能超过500位'
      }),
      categoryId: Joi.number().integer().positive().optional().messages({
        'number.integer': '分类ID必须是整数',
        'number.positive': '分类ID必须是正数'
      }),
      tags: Joi.string().max(200).optional().messages({
        'string.max': '标签长度不能超过200位'
      }),
      status: Joi.string().valid('draft', 'published', 'archived').optional().messages({
        'any.only': '状态只能是draft、published或archived'
      })
    });
    
    return Validator.validate(data, schema);
  }
}