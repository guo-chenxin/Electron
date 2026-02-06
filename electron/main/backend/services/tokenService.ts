// 令牌管理服务类
import keytar from 'keytar';
import jwt from 'jsonwebtoken';

// 令牌管理服务类
export class TokenService {
  private static instance: TokenService;
  private accessToken: string | null = null;
  private readonly TOKEN_SERVICE_NAME = 'ElectronApp';
  private readonly REFRESH_TOKEN_KEY_PREFIX = 'refresh_token_';
  private readonly REFRESH_INTERVAL = 4 * 60 * 1000; // 4分钟
  private refreshController: AbortController;
  
  // JWT配置
  private readonly JWT_SECRET = 'your-secret-key-change-in-production'; // 生产环境中应使用环境变量
  private readonly ACCESS_TOKEN_EXPIRES_IN = '1h'; // 访问令牌有效期1小时
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d'; // 刷新令牌有效期7天

  private constructor() {
    // 初始化刷新控制器
    this.refreshController = new AbortController();
    // 启动定时刷新
    this.startRefreshTimer();
  }

  // 获取单例实例
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // 保存access_token到内存
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // 获取access_token
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  // 保存refresh_token到系统保险箱
  public async saveRefreshToken(userId: number, token: string): Promise<void> {
    try {
      const key = `${this.REFRESH_TOKEN_KEY_PREFIX}${userId}`;
      await keytar.setPassword(this.TOKEN_SERVICE_NAME, key, token);
    } catch (error) {
      console.error('[令牌服务] 保存refresh_token失败:', error);
    }
  }

  // 获取refresh_token
  public async getRefreshToken(userId: number): Promise<string | null> {
    try {
      const key = `${this.REFRESH_TOKEN_KEY_PREFIX}${userId}`;
      return await keytar.getPassword(this.TOKEN_SERVICE_NAME, key);
    } catch (error) {
      console.error('[令牌服务] 获取refresh_token失败:', error);
      return null;
    }
  }

  // 删除refresh_token
  public async deleteRefreshToken(userId: number): Promise<void> {
    try {
      const key = `${this.REFRESH_TOKEN_KEY_PREFIX}${userId}`;
      await keytar.deletePassword(this.TOKEN_SERVICE_NAME, key);
    } catch (error) {
      console.error('[令牌服务] 删除refresh_token失败:', error);
    }
  }

  // 清除所有令牌
  public clearTokens(): void {
    this.accessToken = null;
    this.stopRefreshTimer();
  }

  // 停止刷新定时器
  public stopRefreshTimer() {
    this.refreshController.abort();
  }

  // 启动定时刷新
  private startRefreshTimer(): void {
    // 停止现有的定时器
    this.stopRefreshTimer();
    
    // 创建新的控制器
    this.refreshController = new AbortController();
    const { signal } = this.refreshController;
    
    const refresh = async () => {
      if (signal.aborted) return;
      
      // 这里应该实现实际的令牌刷新逻辑
      // 由于需要userId，实际刷新应该在有用户登录后进行
      console.log('[令牌服务] 检查令牌刷新');
      
      // 设置下一次刷新
      setTimeout(refresh, this.REFRESH_INTERVAL);
    };
    
    // 启动第一次刷新
    setTimeout(refresh, this.REFRESH_INTERVAL);
  }

  // 重启刷新定时器
  public restartRefreshTimer() {
    this.startRefreshTimer();
  }

  // 生成JWT访问令牌
  public generateAccessToken(userId: number, email: string, role: string = 'user'): string {
    const payload = {
      userId,
      email,
      role,
      type: 'access'
    };
    
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN });
  }
  
  // 生成JWT刷新令牌
  public generateRefreshToken(userId: number): string {
    const payload = {
      userId,
      type: 'refresh'
    };
    
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN });
  }
  
  // 验证JWT令牌
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      console.error('[令牌服务] 验证令牌失败:', error);
      return null;
    }
  }
  
  // 刷新access_token
  public async refreshAccessToken(userId: number): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken(userId);
      if (!refreshToken) {
        console.warn('[令牌服务] 没有refresh_token，无法刷新access_token');
        return null;
      }

      // 验证刷新令牌
      const decoded = this.verifyToken(refreshToken);
      if (!decoded || decoded.type !== 'refresh' || decoded.userId !== userId) {
        console.warn('[令牌服务] 刷新令牌无效');
        return null;
      }

      // 生成新的访问令牌
      const newAccessToken = this.generateAccessToken(userId, '', 'user');
      this.setAccessToken(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('[令牌服务] 刷新access_token失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const tokenService = TokenService.getInstance();
