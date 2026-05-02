<template>
  <div class="login-page">
    <!-- 装饰性背景，模拟 AI 的深邃感 -->
    <div class="background-glow"></div>

    <div class="login-card">
      <button
        class="theme-toggle"
        @click="toggleTheme"
        type="button"
        :title="isDark ? '切换到白天模式' : '切换到黑夜模式'"
        :aria-label="isDark ? '切换到白天模式' : '切换到黑夜模式'"
      >
        <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
      </button>
      <div class="header">
        <div class="logo">
          <!-- 模拟 AI 标志 -->
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <h1>欢迎回来</h1>
        <p class="subtitle">登录您的 AI 助手以继续</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入您的账号"
            required 
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="••••••••"
            required 
          />
        </div>

        <button type="submit" :disabled="isLoading" class="login-button">
          <span v-if="!isLoading">继续</span>
          <span v-else class="loader"></span>
        </button>
      </form>

      <transition name="fade">
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </transition>

      <div class="footer">
        <p>还没有账号？ <a href="#">立即注册</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useTheme } from '@/composables/useTheme';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      isLoading: false // 新增加载状态提升体验
    };
  },
  setup() {
    const { isDark, toggleTheme } = useTheme();
    return {
      isDark,
      toggleTheme
    };
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const response = await axios.post('http://localhost:8060/user/login', {
          username: this.username,
          password: this.password
        });

        const userLoginVO = response.data.data;
        this.$router.push({ name: 'Chat', query: { username: userLoginVO.username } });
      } catch (error) {
        this.errorMessage = '登录失败，请检查您的凭据';
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 核心设计变量 */
:host {
  --primary: #ffffff;
  --bg-color: #0a0a0a;
  --card-bg: #171717;
  --input-bg: #212121;
  --text-main: #ededed;
  --text-muted: #a0a0a0;
  --accent: #3b82f6;
  --error: #ef4444;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(900px 380px at 50% -20%, rgba(97, 116, 255, 0.22), transparent 65%),
    #080a10;
  font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text-main);
  position: relative;
  overflow: hidden;
}

/* 背景光晕，增加科技感 */
.background-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%);
  filter: blur(50px);
  pointer-events: none;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(10px);
  z-index: 1;
}

.theme-toggle {
  position: absolute;
  top: 14px;
  right: 14px;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 16px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  color: var(--text-main);
  background: var(--panel-bg);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  color: #fff;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 0 0 8px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
}

input {
  width: 100%;
  padding: 12px 16px;
  background-color: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 15px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--focus-border);
  background-color: var(--input-bg-focus);
  box-shadow: 0 0 0 3px var(--focus-shadow);
}

.login-button {
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.25s ease;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(161, 176, 255, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  text-align: center;
  margin-top: 16px;
  background: rgba(239, 68, 68, 0.1);
  padding: 10px;
  border-radius: 6px;
}

.footer {
  margin-top: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.footer a {
  color: var(--text-main);
  text-decoration: none;
  font-weight: 500;
}

.footer a:hover {
  text-decoration: underline;
}

/* 简单的加载动画 */
.loader {
  width: 18px;
  height: 18px;
  border: 2px solid var(--button-text);
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

</style>