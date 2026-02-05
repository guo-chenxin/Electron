import type { FormRules } from 'element-plus'

/**
 * 项目表单验证规则
 */
export const projectFormRules: FormRules = {
  title: [
    { required: true, message: '请输入项目标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { min: 0, max: 200, message: '描述长度不超过 200 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择项目图标', trigger: 'blur' }
  ],
  routePath: [
    { required: true, message: '请输入根路由', trigger: 'blur' },
    { pattern: /^\/[a-zA-Z0-9\-_]+$/, message: '路由格式不正确，只能包含英文、数字、下划线和斜杠，应以/开头，例如：/***', trigger: 'blur' }
  ],
  redirect: [
    { required: true, message: '请输入重定向路径', trigger: 'blur' }
  ],
  showInMenu: [
    { required: true, message: '请设置是否显示在菜单', trigger: 'change' }
  ],
  showInTabs: [
    { required: true, message: '请设置是否显示在标签页', trigger: 'change' }
  ],
  requiresAuth: [
    { required: true, message: '请设置是否需要认证', trigger: 'change' }
  ],
  order: [
    { required: true, message: '请输入菜单顺序', trigger: 'blur' }
  ]
}

/**
 * 菜单项表单验证规则
 */
export const menuItemFormRules: FormRules = {
  title: [
    { required: true, message: '请输入菜单项标题', trigger: 'blur' },
    { min: 2, max: 30, message: '标题长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择菜单项图标', trigger: 'blur' }
  ],
  routePath: [
    { required: true, message: '请输入菜单项路由', trigger: 'blur' },
    { pattern: /^\/[a-zA-Z0-9\-_\/]+$/, message: '路由格式不正确，只能包含英文、数字、下划线和斜杠，应以/开头', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件路径', trigger: 'blur' }
  ],
  showInMenu: [
    { required: true, message: '请设置是否显示在菜单', trigger: 'change' }
  ],
  showInTabs: [
    { required: true, message: '请设置是否显示在标签页', trigger: 'change' }
  ],
  requiresAuth: [
    { required: true, message: '请设置是否需要认证', trigger: 'change' }
  ],
  order: [
    { required: true, message: '请输入菜单顺序', trigger: 'blur' }
  ]
}
