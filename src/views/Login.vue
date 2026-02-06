<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">欢迎回来</h1>
      
      <el-form 
        :model="form" 
        @submit.prevent="handleSubmit" 
        class="login-form"
        :rules="{}"
        :validate-on-blur="false"
        :validate-on-change="false"
        hide-required-asterisk
      >
        <!-- 邮箱输入 -->
        <el-form-item>
          <el-input
            v-model="form.email"
            type="email"
            placeholder="邮箱"
            :disabled="isLoggingIn"
            size="large"
          />
        </el-form-item>
        
        <!-- 验证码输入和获取按钮 -->
        <el-form-item v-if="currentLoginMethod === 'code'">
          <div class="verification-code-row">
            <el-input
              v-model="form.verificationCode"
              placeholder="验证码"
              :disabled="isLoggingIn"
              size="large"
              style="width: 65%; --el-input-focus-border-color: #dcdfe6; --el-input-focus-box-shadow: none"
            />
            <el-button
              @click="sendVerificationCode"
              :disabled="isSendingCode || isLoggingIn"
              size="large"
              style="width: 32%; color: #409eff; border: 1px solid #ecf5ff; background: #ecf5ff"
            >
              {{ isSendingCode ? `${countdown}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <!-- 密码输入框 -->
        <el-form-item v-else>
          <el-input
            v-model="form.password"
            :type="isPasswordVisible ? 'text' : 'password'"
            placeholder="密码"
            :disabled="isLoggingIn"
            size="large"
            style="--el-input-focus-border-color: #dcdfe6; --el-input-focus-box-shadow: none"
          >
            <template #suffix>
              <span 
                class="password-toggle" 
                @click="togglePasswordVisibility"
                style="cursor: pointer; color: #909399; font-size: 18px; padding: 0 8px; display: flex; align-items: center; justify-content: center"
              >
                <span v-if="isPasswordVisible" class="i-carbon-view"></span>
                <span v-else class="i-carbon-view-off"></span>
              </span>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 登录/注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            size="large"
            :loading="isLoggingIn"
            style="width: 100%; --el-button-focus-border-color: #409eff; --el-button-focus-box-shadow: none"
          >
            {{ currentLoginMethod === 'code' ? '登录/注册' : '登录' }}
          </el-button>
        </el-form-item>
        
        <!-- 切换登录方式选项 -->
        <el-form-item>
          <div class="password-login">
            <a href="#" class="password-link" @click.prevent="toggleLoginMethod">
              {{ currentLoginMethod === 'code' ? '密码登录' : '验证码登录' }}
            </a>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
// 导入ElementPlus组件
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus';
import { messageManager } from '../utils/messageManager';

const { loginWithCode, loginWithPassword } = useAuth();

// 登录方式枚举
const LoginMethod = {
  CODE: 'code',
  PASSWORD: 'password'
};

const form = reactive({
  email: '',
  verificationCode: '',
  password: ''
});

const currentLoginMethod = ref(LoginMethod.CODE);
const isSendingCode = ref(false);
const isLoggingIn = ref(false);
const countdown = ref(60);
const isPasswordVisible = ref(false);
let countdownController: AbortController | null = null;

// 切换密码可见性
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

// 切换登录方式
const toggleLoginMethod = () => {
  if (currentLoginMethod.value === LoginMethod.CODE) {
    currentLoginMethod.value = LoginMethod.PASSWORD;
  } else {
    currentLoginMethod.value = LoginMethod.CODE;
  }
};

// 移除JSX渲染函数，改用直接布局

// 发送验证码
const sendVerificationCode = async () => {
  if (!form.email) {
    messageManager.error('请输入邮箱地址');
    return;
  }
  
  try {
    isSendingCode.value = true;
    
    // 调用后端API发送验证码
    await window.electronAPI.invoke('api:auth:sendVerificationCode', form.email);
    
    // 发送成功，启动倒计时
    startCountdown();
    
    messageManager.success('验证码发送成功');
  } catch (err: any) {
    messageManager.error(err.message || '发送验证码失败，请稍后重试');
    isSendingCode.value = false;
  }
};

// 倒计时函数
const startCountdown = () => {
  countdown.value = 60;
  isSendingCode.value = true;
  
  // 停止现有的倒计时
  stopCountdown();
  
  // 创建新的控制器
  countdownController = new AbortController();
  const { signal } = countdownController;
  
  // 使用 setTimeout 实现可取消的倒计时
  const tick = () => {
    if (signal.aborted) return;
    
    countdown.value--;
    
    if (countdown.value <= 0) {
      isSendingCode.value = false;
      countdownController = null;
    } else {
      // 设置下一次tick
      setTimeout(tick, 1000);
    }
  };
  
  // 启动第一次tick
  setTimeout(tick, 1000);
};

// 停止倒计时
const stopCountdown = () => {
  if (countdownController) {
    countdownController.abort();
    countdownController = null;
  }
};

// 处理登录提交
const handleSubmit = async () => {
  if (!form.email) {
    messageManager.error('请输入邮箱地址');
    return;
  }
  
  // 根据当前登录方式验证表单
  if (currentLoginMethod.value === LoginMethod.CODE) {
    if (!form.verificationCode) {
      messageManager.error('请输入验证码');
      return;
    }
  } else {
    if (!form.password) {
      messageManager.error('请输入密码');
      return;
    }
  }
  
  try {
    // 防止重复提交
    if (isLoggingIn.value) {
      return;
    }
    
    isLoggingIn.value = true;
    
    let success = false;
    
    if (currentLoginMethod.value === LoginMethod.CODE) {
      // 使用验证码登录
      success = await loginWithCode(form.email, form.verificationCode);
    } else {
      // 使用密码登录
      success = await loginWithPassword(form.email, form.password);
    }
    
    // 无论登录成功与否，都重置登录状态
    isLoggingIn.value = false;
    
    if (success) {
      messageManager.success('登录成功');
    } else {
      messageManager.error('登录失败，请稍后重试');
    }
  } catch (err: any) {
    // 如果是验证码无效或已过期错误，检查用户是否已经登录
    const isLoggedIn = localStorage.getItem('userInfo') !== null;
    if (isLoggedIn && err.message === '验证码无效或已过期') {
      // 实际已经登录成功，显示成功消息
      messageManager.success('登录成功');
    } else {
      // 其他错误，显示错误消息
      messageManager.error(err.message || '登录失败，请稍后重试');
    }
    isLoggingIn.value = false;
  }
};

// 清理定时器
const cleanup = () => {
  stopCountdown();
};

// 组件卸载时清理
onUnmounted(cleanup);
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: transparent;
  padding: 0;
}

.login-box {
  background-color: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 420px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

/* 鼠标悬停效果 */
.login-box:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  transform: translateY(-2px);
}

.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  color: #303133;
  letter-spacing: 0.5px;
}

.login-subtitle {
  text-align: center;
  color: #909399;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.login-form {
  width: 100%;
}

/* 调整表单项间距 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 移除表单项标签 */
:deep(.el-form-item__label) {
  display: none;
}

/* 验证码行布局 */
.verification-code-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  height: 44px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

/* 输入框聚焦样式 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  border-color: #409eff;
}

/* 按钮基础样式 */
:deep(.el-button) {
  border-radius: 8px;
  height: 44px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  outline: none;
  box-shadow: none;
}

/* 按钮聚焦样式 */
:deep(.el-button:focus) {
  outline: none;
  box-shadow: none;
}

/* 普通按钮悬停样式 */
:deep(.el-button:hover:not(:disabled)) {
  background-color: #e6f2ff;
  border-color: #d9ecff;
  color: #66b1ff;
}

/* 主要按钮样式 */
:deep(.el-button--primary) {
  width: 100%;
  height: 44px;
  font-size: 1.05rem;
  border-radius: 8px;
  background-color: #409eff;
  border-color: #409eff;
  transition: all 0.3s ease;
  outline: none;
  box-shadow: none;
}

/* 主要按钮悬停样式 */
:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 主要按钮点击样式 */
:deep(.el-button--primary:active) {
  background-color: #3a8ee6;
  border-color: #3a8ee6;
  box-shadow: none;
}

/* 主要按钮聚焦样式 */
:deep(.el-button--primary:focus) {
  outline: none;
  box-shadow: none;
}

/* 密码登录链接样式 */
.password-login {
  text-align: center;
  margin-top: 25px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.password-link {
  color: #409eff;
  text-decoration: none;
  font-size: 0.95rem;
  text-align: center;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.password-link:hover {
  color: #66b1ff;
  background-color: rgba(64, 158, 255, 0.1);
  text-decoration: none;
}

/* 错误提示样式 */
:deep(.el-alert) {
  margin-bottom: 15px;
  padding: 8px 12px;
  font-size: 0.8rem;
}
</style>
