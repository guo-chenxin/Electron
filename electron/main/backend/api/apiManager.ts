import { registerAuthRoutes } from './routes/authRoutes';
import { registerUserRoutes } from './routes/userRoutes';
import { registerArticleRoutes } from './routes/articleRoutes';
import { registerCategoryRoutes } from './routes/categoryRoutes';
import { registerCardRoutes } from './routes/cardRoutes';
import { registerRouteRoutes } from './routes/routeRoutes';

/**
 * API管理器类，用于处理IPC通信
 */
export class APIManager {
  /**
   * 初始化API路由
   */
  public initialize(): void {
    console.log('Initializing API routes...');
    
    // 注册认证相关API
    registerAuthRoutes();
    
    // 注册用户相关API
    registerUserRoutes();
    
    // 注册文章相关API
    registerArticleRoutes();
    
    // 注册分类相关API
    registerCategoryRoutes();
    
    // 注册卡片相关API
    registerCardRoutes();
    
    // 注册路由相关API
    registerRouteRoutes();
    
    console.log('API routes initialized successfully');
  }
}

// 导出单例实例
export const apiManager = new APIManager();
