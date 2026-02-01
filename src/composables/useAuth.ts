import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 扩展Window接口，添加electronAPI类型定义
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    };
  }
}

// 用户信息类型
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 认证状态类型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// 认证响应类型
export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// 刷新令牌响应类型
interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
}

// 单例模式 - 全局共享的认证状态
let globalAuthState: { value: AuthState } | null = null;

// 从localStorage加载用户信息
const loadAuthFromStorage = (): AuthState => {
  try {
    // 从localStorage加载用户信息
    const savedUser = localStorage.getItem('userInfo');
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    
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

// 初始化全局认证状态
const initializeAuthState = (): AuthState => {
  return loadAuthFromStorage();
};

export function useAuth() {
  const router = useRouter();
  const refreshTimer = ref<number | null>(null);
  const REFRESH_INTERVAL = 4 * 60 * 1000; // 4分钟

  // 单例模式：确保全局只有一个authState实例
  if (!globalAuthState) {
    globalAuthState = ref<AuthState>(initializeAuthState());
  }

  // 使用全局共享的认证状态
  const authState = globalAuthState;

  // 保存认证信息到localStorage
  const saveAuthInfo = (user: User, accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch (error) {
      console.error('Failed to save auth info to localStorage:', error);
      ElMessage.error('保存登录信息失败，请检查浏览器设置');
    }
  };

  // 清除localStorage中的认证信息
  const clearAuthInfo = () => {
    try {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.error('Failed to clear auth info from localStorage:', error);
    }
  };

  // 启动令牌刷新定时器
  const startTokenRefresh = (userId: number) => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value);
    }

    refreshTimer.value = window.setInterval(async () => {
      try {
        const result = await window.electronAPI.invoke<RefreshTokenResponse>('api:auth:refreshToken', userId);
        if (result.success) {
          authState.value.accessToken = result.accessToken;
          localStorage.setItem('accessToken', result.accessToken);
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        ElMessage.warning('登录已过期，请重新登录');
        logout();
      }
    }, REFRESH_INTERVAL);
  };

  // 停止令牌刷新
  const stopTokenRefresh = () => {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value);
      refreshTimer.value = null;
    }
  };

  // 处理登录成功
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

  // 验证码登录处理
  const loginWithCode = async (email: string, code: string) => {
    try {
      const result = await window.electronAPI.invoke<AuthResponse>('api:auth:loginWithCode', email, code);
      
      if (result.success) {
        return handleLoginSuccess(result);
      }
      return false;
    } catch (error) {
      console.error('Login with code failed:', error);
      ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
      return false;
    }
  };
  
  // 密码登录处理
  const loginWithPassword = async (email: string, password: string) => {
    try {
      const result = await window.electronAPI.invoke<AuthResponse>('api:auth:loginWithPassword', email, password);
      
      if (result.success) {
        return handleLoginSuccess(result);
      }
      return false;
    } catch (error) {
      console.error('Login with password failed:', error);
      ElMessage.error(error instanceof Error ? error.message : '登录失败，请检查邮箱和密码');
      return false;
    }
  };
  
  // 从localStorage加载用户信息和令牌（并启动刷新）
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

  // 登出处理
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