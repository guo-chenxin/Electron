// 用户相关验证器
import Joi from 'joi';
import { Validator, ValidationResult } from './baseValidator';

// 用户登录请求验证
export interface LoginRequest {
  email: string;
  code: string;
}

// 密码登录请求验证
export interface PasswordLoginRequest {
  email: string;
  password: string;
}

// 用户验证器类
export class UserValidator {
  // 登录请求验证
  static validateLogin(data: any): ValidationResult {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱不能为空'
      }),
      code: Joi.string().length(6).required().messages({
        'string.length': '验证码必须为6位',
        'any.required': '验证码不能为空'
      })
    });
    
    return Validator.validate<LoginRequest>(data, schema);
  }
  
  // 密码登录请求验证
  static validatePasswordLogin(data: any): ValidationResult {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱不能为空'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': '密码长度不能少于6位',
        'any.required': '密码不能为空'
      })
    });
    
    return Validator.validate<PasswordLoginRequest>(data, schema);
  }
  
  // 创建用户请求验证
  static validateCreateUser(data: any): ValidationResult {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).required().messages({
        'string.min': '用户名长度不能少于3位',
        'string.max': '用户名长度不能超过50位',
        'any.required': '用户名不能为空'
      }),
      email: Joi.string().email().required().messages({
        'string.email': '请输入有效的邮箱地址',
        'any.required': '邮箱不能为空'
      }),
      password: Joi.string().min(6).optional().messages({
        'string.min': '密码长度不能少于6位'
      }),
      avatarUrl: Joi.string().uri().optional().messages({
        'string.uri': '请输入有效的头像URL'
      }),
      bio: Joi.string().max(500).optional().messages({
        'string.max': '个人简介不能超过500位'
      }),
      role: Joi.string().valid('user', 'admin').optional().messages({
        'any.only': '角色只能是user或admin'
      })
    });
    
    return Validator.validate(data, schema);
  }
  
  // 更新用户请求验证
  static validateUpdateUser(data: any): ValidationResult {
    const schema = Joi.object({
      username: Joi.string().min(3).max(50).optional().messages({
        'string.min': '用户名长度不能少于3位',
        'string.max': '用户名长度不能超过50位'
      }),
      email: Joi.string().email().optional().messages({
        'string.email': '请输入有效的邮箱地址'
      }),
      password: Joi.string().min(6).optional().messages({
        'string.min': '密码长度不能少于6位'
      }),
      avatarUrl: Joi.string().uri().optional().messages({
        'string.uri': '请输入有效的头像URL'
      }),
      bio: Joi.string().max(500).optional().messages({
        'string.max': '个人简介不能超过500位'
      }),
      role: Joi.string().valid('user', 'admin').optional().messages({
        'any.only': '角色只能是user或admin'
      })
    });
    
    return Validator.validate(data, schema);
  }
}