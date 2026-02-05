// 卡片相关验证器
import Joi from 'joi';
import { Validator, ValidationResult } from './baseValidator';

// 卡片验证器类
export class CardValidator {
  // 创建卡片请求验证
  static validateCreateCard(data: any): ValidationResult {
    const schema = Joi.object({
      title: Joi.string().min(2).max(50).required().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过50位',
        'any.required': '标题不能为空'
      }),
      description: Joi.string().max(200).optional().messages({
        'string.max': '描述长度不能超过200位'
      }),
      icon: Joi.string().optional(),
      routePath: Joi.string().required().messages({
        'any.required': '路由路径不能为空'
      }),
      redirect: Joi.string().optional(),
      showInMenu: Joi.boolean().optional().default(true),
      showInTabs: Joi.boolean().optional().default(true),
      requiresAuth: Joi.boolean().optional().default(false),
      order: Joi.number().integer().optional().default(999),
      menuItems: Joi.array().optional().items(
        Joi.object({
          title: Joi.string().min(2).max(30).required().messages({
            'string.min': '菜单项标题长度不能少于2位',
            'string.max': '菜单项标题长度不能超过30位',
            'any.required': '菜单项标题不能为空'
          }),
          icon: Joi.string().optional(),
          routePath: Joi.string().required().messages({
            'any.required': '菜单项路由路径不能为空'
          }),
          component: Joi.string().required().messages({
            'any.required': '菜单项组件路径不能为空'
          }),
          showInMenu: Joi.boolean().optional().default(true),
          showInTabs: Joi.boolean().optional().default(false),
          requiresAuth: Joi.boolean().optional().default(true),
          order: Joi.number().integer().optional().default(1)
        })
      )
    });
    
    return Validator.validate(data, schema);
  }
  
  // 更新卡片请求验证
  static validateUpdateCard(data: any): ValidationResult {
    const schema = Joi.object({
      title: Joi.string().min(2).max(50).optional().messages({
        'string.min': '标题长度不能少于2位',
        'string.max': '标题长度不能超过50位'
      }),
      description: Joi.string().max(200).optional().messages({
        'string.max': '描述长度不能超过200位'
      }),
      icon: Joi.string().optional(),
      routePath: Joi.string().optional(),
      redirect: Joi.string().optional(),
      showInMenu: Joi.boolean().optional(),
      showInTabs: Joi.boolean().optional(),
      requiresAuth: Joi.boolean().optional(),
      order: Joi.number().integer().optional(),
      menuItems: Joi.array().optional().items(
        Joi.object({
          title: Joi.string().min(2).max(30).required().messages({
            'string.min': '菜单项标题长度不能少于2位',
            'string.max': '菜单项标题长度不能超过30位',
            'any.required': '菜单项标题不能为空'
          }),
          icon: Joi.string().optional(),
          routePath: Joi.string().required().messages({
            'any.required': '菜单项路由路径不能为空'
          }),
          component: Joi.string().required().messages({
            'any.required': '菜单项组件路径不能为空'
          }),
          showInMenu: Joi.boolean().optional().default(true),
          showInTabs: Joi.boolean().optional().default(false),
          requiresAuth: Joi.boolean().optional().default(true),
          order: Joi.number().integer().optional().default(1)
        })
      )
    });
    
    return Validator.validate(data, schema);
  }
}