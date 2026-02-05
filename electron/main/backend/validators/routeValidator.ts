// 路由相关验证器
import Joi from 'joi';
import { Validator, ValidationResult } from './baseValidator';

// 路由验证器类
export class RouteValidator {
  // 创建路由请求验证
  static validateCreateRoute(data: any): ValidationResult {
    const schema = Joi.object({
      path: Joi.string().required().messages({
        'any.required': '路径不能为空'
      }),
      name: Joi.string().optional(),
      component: Joi.string().optional(),
      redirect: Joi.string().optional(),
      parentId: Joi.number().integer().optional(),
      projectId: Joi.string().optional(),
      title: Joi.string().min(2).max(50).required().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过50位',
        'any.required': '标题不能为空'
      }),
      icon: Joi.string().optional(),
      requiresAuth: Joi.boolean().optional().default(false),
      permission: Joi.string().optional(),
      keepAlive: Joi.boolean().optional().default(false),
      showInMenu: Joi.boolean().optional().default(true),
      showInTabs: Joi.boolean().optional().default(false),
      order: Joi.number().integer().optional().default(999)
    });
    
    return Validator.validate(data, schema);
  }
  
  // 更新路由请求验证
  static validateUpdateRoute(data: any): ValidationResult {
    const schema = Joi.object({
      path: Joi.string().optional(),
      name: Joi.string().optional(),
      component: Joi.string().optional(),
      redirect: Joi.string().optional(),
      parentId: Joi.number().integer().optional(),
      projectId: Joi.string().optional(),
      title: Joi.string().min(2).max(50).optional().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过50位'
      }),
      icon: Joi.string().optional(),
      requiresAuth: Joi.boolean().optional(),
      permission: Joi.string().optional(),
      keepAlive: Joi.boolean().optional(),
      showInMenu: Joi.boolean().optional(),
      showInTabs: Joi.boolean().optional(),
      order: Joi.number().integer().optional()
    });
    
    return Validator.validate(data, schema);
  }
}