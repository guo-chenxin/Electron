import { ref, computed, watch, Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TabItem, TabConfigItem } from '../types/tabs';

// 扩展Window接口，添加electronAPI类型定义
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
    };
  }
}

// 常量定义
const STORAGE_KEYS = {
  OPEN_TABS: 'openTabs',
  LAST_VISITED_PATHS: 'lastVisitedPaths'
};

const DEFAULT_TAB_CONFIG = {
  '/': { title: '主窗口', icon: 'i-carbon-home' }
};

/**
 * 全局标签页状态
 * 单例模式确保整个应用共享同一个标签页状态
 */
let globalTabState: {
  openTabs: Ref<string[]>;
  lastVisitedPaths: Ref<Record<string, string>>;
  tabConfig: Ref<Record<string, TabConfigItem>>;
} | null = null;

/**
 * 初始化全局标签页状态
 * @returns 标签页状态对象
 */
const initializeTabState = () => {
  // 从localStorage加载标签页状态
  const savedTabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
  const savedPaths = localStorage.getItem(STORAGE_KEYS.LAST_VISITED_PATHS);
  
  // 确保openTabs始终是字符串数组
  const initialOpenTabs: string[] = savedTabs ? JSON.parse(savedTabs) : ['/'];
  // 确保lastVisitedPaths始终是字符串记录
  const initialLastVisitedPaths: Record<string, string> = savedPaths ? JSON.parse(savedPaths) : {
    '/': '/'
  };
  
  return {
    openTabs: ref<string[]>(initialOpenTabs),
    lastVisitedPaths: ref<Record<string, string>>(initialLastVisitedPaths),
    tabConfig: ref<Record<string, TabConfigItem>>(DEFAULT_TAB_CONFIG)
  };
};

/**
 * 从数据库获取路由数据并更新标签页配置
 */
export const fetchRoutesForTabs = async () => {
  try {
    // 检查window.electronAPI是否存在
    if (!window.electronAPI) {
      console.warn('window.electronAPI is not available, using default tab config');
      return;
    }
    
    // 确保globalTabState已初始化
    if (!globalTabState) {
      globalTabState = initializeTabState();
    }
    
    const { tabConfig } = globalTabState;
    
    // 从主进程获取路由配置
    const routesFromDb = await window.electronAPI.invoke<any[]>('api:routes:getAllNested');
    
    console.log('Routes from database for tabs:', routesFromDb);
    
    // 处理路由数据，更新标签页配置
    const config: Record<string, TabConfigItem> = { ...DEFAULT_TAB_CONFIG };
    
    // 遍历路由数据，提取需要显示在标签页中的路由
    const processRoutes = (routes: any[]) => {
      for (const route of routes) {
        // 只有showInTabs为true的路由才显示在标签页中
        if (route.showInTabs) {
          config[route.path] = {
            title: route.title,
            icon: route.icon || 'i-carbon-home'
          };
          console.log('Added route to tab config:', route.path, route.title, route.icon);
        }
        
        // 处理子路由
        if (route.children && route.children.length > 0) {
          processRoutes(route.children);
        }
      }
    };
    
    processRoutes(routesFromDb);
    
    // 更新标签页配置
    tabConfig.value = config;
    console.log('Tab config updated:', config);
  } catch (error) {
    console.error('Failed to fetch routes for tabs:', error);
  }
};

/**
 * 标签页管理组合式API
 * 提供标签页的创建、关闭、切换等功能
 */
export function useTabs() {
  const route = useRoute();
  const router = useRouter();
  
  // 单例模式：确保全局只有一个tabState实例
  if (!globalTabState) {
    globalTabState = initializeTabState();
  }

  // 使用全局共享的标签页状态
  const { openTabs, lastVisitedPaths, tabConfig } = globalTabState;

  /**
   * 保存标签页状态到localStorage
   */
  const saveTabState = () => {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(openTabs.value));
    localStorage.setItem(STORAGE_KEYS.LAST_VISITED_PATHS, JSON.stringify(lastVisitedPaths.value));
  };

  /**
   * 计算属性：获取当前显示的标签页路由信息
   */
  const tabRoutes = computed(() => {
    // 只显示tabConfig中存在的标签页
    return openTabs.value
      .filter(path => tabConfig.value[path] !== undefined)
      .map(path => {
        const config = tabConfig.value[path];
        return {
          path,
          title: config?.title || path,
          icon: config?.icon || 'i-carbon-home'
        };
      });
  });
  
  /**
   * 找到当前路径对应的标签页路径
   * @param newPath 当前路径
   * @returns 标签页路径
   */
  const findTabPathForRoute = (newPath: string): string => {
    // 遍历tabConfig中的所有路径，找到最匹配的
    let tabPath = '/';
    let longestMatch = 0;
    
    for (const path in tabConfig.value) {
      // 检查当前路径是否以tabConfig中的路径开头，且是最长匹配
      if (newPath.startsWith(path) && path.length > longestMatch) {
        tabPath = path;
        longestMatch = path.length;
      }
    }
    
    return tabPath;
  };

  // 监听tabConfig变化，清理不需要的标签页
  watch(tabConfig, (newConfig) => {
    // 过滤掉不在tabConfig中的标签页
    const validTabs = openTabs.value.filter(path => newConfig[path] !== undefined);
    
    // 如果有变化，更新openTabs
    if (validTabs.length !== openTabs.value.length) {
      openTabs.value = validTabs;
      // 保存到localStorage
      saveTabState();
    }
  }, { deep: true });

  // 监听路由变化，自动管理标签页并保存最后访问路径
  watch(() => route.path, (newPath) => {
    // 根据当前路径确定所属的标签页
    const tabPath = findTabPathForRoute(newPath);
    
    // 如果标签页未打开，则添加
    if (!openTabs.value.includes(tabPath)) {
      openTabs.value.push(tabPath);
    }
    
    // 保存当前路径到对应的标签页
    lastVisitedPaths.value[tabPath] = newPath;
    
    // 保存标签页状态
    saveTabState();
  }, { immediate: true });
  
  // 初始化时获取路由数据
  fetchRoutesForTabs();

  // 监听标签页变化，保存到localStorage
  watch(openTabs, () => {
    saveTabState();
  }, { deep: true });

  /**
   * 关闭标签页
   * @param path 标签页路径
   */
  const closeTab = (path: string) => {
    // 主窗口标签不可关闭
    if (path === '/') return;
    
    // 找到要关闭的标签页索引
    const index = openTabs.value.indexOf(path);
    if (index === -1) return;
    
    // 从数组中移除标签页
    openTabs.value.splice(index, 1);
    
    // 如果关闭的是当前活跃标签页，切换到其他标签页
    if (route.path.startsWith(path)) {
      // 切换到前一个标签页或主窗口
      const newTab = openTabs.value[index - 1] || '/';
      router.push(lastVisitedPaths.value[newTab] || newTab);
    }
  };

  /**
   * 重置标签页，只保留主窗口标签
   */
  const resetTabs = () => {
    openTabs.value = ['/'];
    // 如果当前不在主窗口，切换到主窗口
    if (route.path !== '/') {
      router.push('/');
    }
  };

  /**
   * 切换到指定标签页
   * @param path 标签页路径
   */
  const switchToTab = (path: string) => {
    // 确保标签页已打开
    if (!openTabs.value.includes(path)) {
      openTabs.value.push(path);
    }
    
    // 跳转到该标签页的最后访问路径
    router.push(lastVisitedPaths.value[path] || path);
  };

  return {
    openTabs,
    lastVisitedPaths,
    tabRoutes,
    closeTab,
    resetTabs,
    switchToTab
  };
}