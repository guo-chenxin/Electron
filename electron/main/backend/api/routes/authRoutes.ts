import { ipcMain } from 'electron';
import { userService } from '../../services/userService';
import { verificationCodeService } from '../../services/verificationCodeService';
import { tokenService } from '../../services/tokenService';
import { UserValidator } from '../../validators/userValidator';
import { ResponseHandler } from '../../utils/responseUtils';
import { ErrorHandler, AppError } from '../../utils/errorUtils';

/**
 * 注册认证相关API路由
 */
export function registerAuthRoutes(): void {
  // 发送验证码
  ipcMain.handle('api:auth:sendVerificationCode', async (_, email: string) => {
    try {
      // 在Electron环境中，IP地址默认为127.0.0.1
      const result = await verificationCodeService.sendVerificationCode(email, '127.0.0.1');
      return ResponseHandler.createSuccessResponse(result, '验证码发送成功');
    } catch (error) {
      console.error('Error in sendVerificationCode:', error);
      const errorMessage = error instanceof Error ? error.message : '验证码发送失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 验证登录（邮箱+验证码）
  ipcMain.handle('api:auth:loginWithCode', async (_, email: string, code: string) => {
    try {
      console.log('=== 登录流程开始 ===');
      console.log('原始邮箱:', email);
      console.log('输入的验证码:', code);
      
      // 验证输入格式
      const validationResult = UserValidator.validateLogin({ email, code });
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || '输入格式错误');
      }
      
      // 统一邮箱地址为小写
      const normalizedEmail = email.toLowerCase();
      console.log('标准化后的邮箱:', normalizedEmail);
      
      // 验证验证码
      console.log('开始验证验证码...');
      const isCodeValid = verificationCodeService.verifyCode(normalizedEmail, code);
      console.log('验证码验证结果:', isCodeValid);
      
      if (!isCodeValid) {
        console.log('验证码验证失败，抛出错误');
        throw new Error('验证码无效或已过期');
      }
      
      console.log('验证码验证成功，开始处理用户登录...');
      
      // 检查用户是否存在
      console.log('检查用户是否存在...');
      let user = await userService.getUserByEmail(normalizedEmail);
      console.log('用户存在结果:', !!user);
      
      if (!user) {
        console.log('用户不存在，开始创建新用户...');
        // 生成随机用户名（使用邮箱前缀）
        const username = normalizedEmail.split('@')[0];
        console.log('生成的用户名:', username);
        
        // 创建用户
        user = await userService.create({
          username, 
          email: normalizedEmail,
          password: '' // 验证码登录不需要密码
        });
        console.log('新用户创建成功:', user);
      } else {
        console.log('找到现有用户:', user);
      }
      
      // 检查用户是否成功创建
      if (!user) {
        console.error('用户创建失败，可能是数据库连接问题');
        throw new Error('登录失败，无法创建用户');
      }
      
      // 生成并存储令牌
      console.log('[DEBUG] Generating tokens...');
      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role || 'user');
      const refreshToken = tokenService.generateRefreshToken(user.id);
      console.log('[DEBUG] Generated tokens:', { accessToken, refreshToken });
      
      // 保存到内存和系统保险箱
      console.log('[DEBUG] Saving tokens...');
      tokenService.setAccessToken(accessToken);
      await tokenService.saveRefreshToken(user.id, refreshToken);
      console.log('[DEBUG] Tokens saved successfully');
      
      // 返回用户信息和令牌
      const result = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        accessToken,
        refreshToken
      };
      console.log('[DEBUG] Login successful, returning result:', result);
      
      return ResponseHandler.createSuccessResponse(result, '登录成功');
    } catch (error) {
      console.error('[ERROR] Login with code failed:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      return ResponseHandler.createErrorResponse(errorMessage, 400);
    }
  });
  
  // 验证登录（邮箱+密码）
  ipcMain.handle('api:auth:loginWithPassword', async (_, email: string, password: string) => {
    try {
      // 验证输入格式
      const validationResult = UserValidator.validatePasswordLogin({ email, password });
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || '输入格式错误');
      }
      
      // 统一邮箱地址为小写
      const normalizedEmail = email.toLowerCase();
      
      // 检查用户是否存在
      const user = await userService.getUserByEmail(normalizedEmail);
      
      if (!user) {
        throw new Error('用户不存在');
      }
      
      // 检查用户是否设置了密码
      if (!user.password) {
        throw new Error('用户未设置密码，请使用验证码登录');
      }
      
      // 验证密码
      if (!userService.verifyPassword(password, user.password)) {
        throw new Error('密码错误');
      }
      
      // 生成并存储令牌
      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role || 'user');
      const refreshToken = tokenService.generateRefreshToken(user.id);
      
      // 保存到内存和系统保险箱
      tokenService.setAccessToken(accessToken);
      await tokenService.saveRefreshToken(user.id, refreshToken);
      
      // 返回用户信息和令牌
      const result = {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        accessToken,
        refreshToken
      };
      
      return ResponseHandler.createSuccessResponse(result, '登录成功');
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      return ResponseHandler.createErrorResponse(errorMessage, 400);
    }
  });

  // 获取当前用户信息
  ipcMain.handle('api:auth:getCurrentUser', async (_, userId: number) => {
    try {
      const user = await userService.getById(userId);
      if (!user) {
        return ResponseHandler.createNotFoundResponse('用户不存在');
      }
      return ResponseHandler.createSuccessResponse(user, '获取用户信息成功');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 刷新访问令牌
  ipcMain.handle('api:auth:refreshToken', async (_, userId: number) => {
    try {
      const newAccessToken = await tokenService.refreshAccessToken(userId);
      if (!newAccessToken) {
        throw new Error('刷新令牌失败');
      }
      const result = {
        accessToken: newAccessToken
      };
      return ResponseHandler.createSuccessResponse(result, '令牌刷新成功');
    } catch (error) {
      console.error('Error in refreshToken:', error);
      const errorMessage = error instanceof Error ? error.message : '令牌刷新失败';
      return ResponseHandler.createErrorResponse(errorMessage, 401);
    }
  });

  // 登出
  ipcMain.handle('api:auth:logout', async (_, userId: number) => {
    try {
      // 清除内存中的access_token
      tokenService.clearTokens();
      
      // 清除系统保险箱中的refresh_token
      await tokenService.deleteRefreshToken(userId);
      
      return ResponseHandler.createSuccessResponse({}, '登出成功');
    } catch (error) {
      console.error('Error in logout:', error);
      const errorMessage = error instanceof Error ? error.message : '登出失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });
}