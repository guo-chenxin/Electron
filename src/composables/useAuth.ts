import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { User, AuthState, AuthResponse, RefreshTokenResponse } from '../types/auth';

// 扩展Window接口，添加electronAPI类型定义
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    };
  }
}

// 常量定义
const REFRESH_INTERVAL = 4 * 60 * 1000; // 4分钟
const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
};

/**
 * 全局认证状态
 * 单例模式确保整个应用共享同一个认证状态
 */
let globalAuthState: { value: AuthState } | null = null;

/**
 * 从localStorage加载用户信息
 * @returns 认证状态对象
 */
const loadAuthFromStorage = (): AuthState => {
  try {
    // 从localStorage加载用户信息
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    const savedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const savedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    // 验证用户信息格式
    const user = savedUser ? JSON.parse(savedUser) as User : null;
    
    return {
      isAuthenticated: !!user,
      user: user,
      accessToken: savedAccessToken,
      refreshToken: savedRefreshToken
    };
  } catch (error) {
    console.error('Failed to load auth state from storage:', error);
    return {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    };
  }
};

/**
 * 初始化全局认证状态
 * @returns 认证状态对象
 */
const initializeAuthState = (): AuthState => {
  return loadAuthFromStorage();
};

/**
 * 认证状态管理组合式API
 * 提供登录、登出、状态管理等功能
 */
export function useAuth() {
  const router = useRouter();
  const refreshTimer = ref<number | null>(null);

  // 单例模式：确保全局只有一个authState实例
  if (!globalAuthState) {
    globalAuthState = ref<AuthState>(initializeAuthState());
  }

  // 使用全局共享的认证状态
  const authState = globalAuthState;

  /**
   * 保存认证信息到localStorage
   * @param user 用户信息
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   */
  const saveAuthInfo = (user: User, accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Failed to save auth info to localStorage:', error);
      ElMessage.error('保存登录信息失败，请检查浏览器设置');
    }
  };

  /**
   * 清除localStorage中的认证信息
   */
  const clearAuthInfo = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to clear auth info from localStorage:', error);
    }
  };

  /**
   * 启动令牌刷新定时器
   * @param userId 用户ID
   */
  const startTokenRefresh = (userId: number) => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value);
    }

    refreshTimer.value = window.setInterval(async () => {
      try {
        const result = await window.electronAPI.invoke<any>('api:auth:refreshToken', userId);
        if (result.status === 'success' && result.data) {
          authState.value.accessToken = result.data.accessToken;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.data.accessToken);
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        ElMessage.warning('登录已过期，请重新登录');
        logout();
      }
    }, REFRESH_INTERVAL);
  };

  /**
   * 停止令牌刷新
   */
  const stopTokenRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value);
      refreshTimer.value = null;
    }
  };

  /**
   * 处理登录成功
   * @param result 认证响应结果
   * @returns 是否登录成功
   */
  const handleLoginSuccess = (result: AuthResponse) => {
    // 更新认证状态
    authState.value.isAuthenticated = true;
    authState.value.user = result.user;
    authState.value.accessToken = result.accessToken;
    authState.value.refreshToken = result.refreshToken;
    
    // 保存认证信息到localStorage
    saveAuthInfo(result.user, result.accessToken, result.refreshToken);
    
    // 启动令牌刷新
    startTokenRefresh(result.user.id);
    
    // 跳转到主窗口
    router.push('/');
    
    return true;
  };

  /**
   * 验证码登录处理
   * @param email 邮箱
   * @param code 验证码
   * @returns 是否登录成功
   */
  const loginWithCode = async (email: string, code: string) => {
    try {
      const result = await window.electronAPI.invoke<any>('api:auth:loginWithCode', email, code);
      
      if (result.status === 'success' && result.data) {
        return handleLoginSuccess(result.data);
      }
      return false;
    } catch (error) {
      console.error('Login with code failed:', error);
      ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
      return false;
    }
  };
  
  /**
   * 密码登录处理
   * @param email 邮箱
   * @param password 密码
   * @returns 是否登录成功
   */
  const loginWithPassword = async (email: string, password: string) => {
    try {
      const result = await window.electronAPI.invoke<any>('api:auth:loginWithPassword', email, password);
      
      if (result.status === 'success' && result.data) {
        return handleLoginSuccess(result.data);
      }
      return false;
    } catch (error) {
      console.error('Login with password failed:', error);
      ElMessage.error(error instanceof Error ? error.message : '登录失败，请检查邮箱和密码');
      return false;
    }
  };
  
  /**
   * 从localStorage加载用户信息和令牌（并启动刷新）
   */
  const loadUserInfo = () => {
    try {
      // 直接使用loadAuthFromStorage函数获取状态
      const loadedState = loadAuthFromStorage();
      
      if (loadedState.isAuthenticated && loadedState.user) {
        // 更新状态
        authState.value = { ...loadedState };
        
        // 启动令牌刷新
        startTokenRefresh(loadedState.user.id);
      }
    } catch (error) {
      console.error('Failed to load user info from localStorage:', error);
      logout();
    }
  };

  /**
   * 登出处理
   */
  const logout = async () => {
    try {
      if (authState.value.user) {
        await window.electronAPI.invoke('api:auth:logout', authState.value.user.id);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // 清除状态
      authState.value.isAuthenticated = false;
      authState.value.user = null;
      authState.value.accessToken = null;
      authState.value.refreshToken = null;
      
      // 清除localStorage中的所有认证信息
      clearAuthInfo();
      
      // 停止令牌刷新
      stopTokenRefresh();
      
      // 跳转到登录页面
      router.push('/login');
    }
  };

  // 计算属性
  const currentUser = computed(() => authState.value.user);
  // 开发环境可以通过环境变量控制默认登录状态
  const isLoggedIn = computed(() => authState.value.isAuthenticated);

  // 生命周期钩子
  onMounted(() => {
    loadUserInfo();
  });

  onUnmounted(() => {
    // 只在组件卸载时停止刷新，不清除状态
    stopTokenRefresh();
  });

  return {
    // 状态（只暴露计算属性，不直接暴露authState）
    currentUser,
    isLoggedIn,
    
    // 方法
    login: loginWithCode, // 默认登录方法使用验证码登录
    loginWithCode,
    loginWithPassword,
    logout,
    loadUserInfo
  };
}