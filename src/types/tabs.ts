// 标签页相关类型定义

/**
 * 标签页项目类型
 */
export interface TabItem {
  path: string;
  title: string;
  icon: string;
}

/**
 * 标签页状态类型
 */
export interface TabState {
  openTabs: string[];
  lastVisitedPaths: Record<string, string>;
}

/**
 * 标签页配置项类型
 */
export interface TabConfigItem {
  title: string;
  icon: string;
}
