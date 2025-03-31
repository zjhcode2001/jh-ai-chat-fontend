<template>
  <div class="chat-app">
    <!-- 侧边栏 -->
    <SideBar
      :chat-history="chatHistory"
      :current-chat-index="currentChatIndex"
      @start-new-chat="startNewChat"
      @switch-chat="switchChat"
    />

    <!-- 主聊天区域 -->
    <div class="main-content">
      <div class="chat-container">
        <!-- 当前对话的概括 -->
        <div v-if="currentSummary" class="current-summary">
          当前对话: {{ currentSummary }}
        </div>

        <!-- 对话记录区域 -->
        <div class="chat-history">
          <div v-for="(message, index) in currentChat.messages" :key="index" :class="['message', message.role]">
            <span class="role">{{ message.role === 'user' ? '你' : 'EVA' }}:</span>
            <div class="content">
              <!-- 复制按钮 -->
              <button
                class="copy-button"
                @click="copyToClipboard(message.content)"
                title="复制"
              >
                复制
              </button>
              <div v-html="renderMarkdown(message.content)"></div>

            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <!-- 输入框和发送按钮 -->
        <div class="chat-input">
          <textarea
            v-model="inputText"
            @keyup.enter="sendMessage"
            placeholder="请输入你的问题..."
            :disabled="isLoading"
          ></textarea>
          <button @click="sendMessage" :disabled="isLoading">
            {{ isLoading ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import SideBar from './SideBar.vue'; // 引入侧边栏组件

export default {
  components: {
    SideBar,
  },
  setup() {
    const inputText = ref(''); // 输入框内容
    const isLoading = ref(false); // 加载状态
    const errorMessage = ref(''); // 错误信息

    // 初始化 markdown-it
    const md = new MarkdownIt();

    // 对话历史记录
    const chatHistory = ref([
      {
        messages: [], // 当前对话的消息记录
      },
    ]);
    const currentChatIndex = ref(0); // 当前对话的索引

    // 当前对话
    const currentChat = computed(() => chatHistory.value[currentChatIndex.value]);

    // 获取当前对话的概括
    const currentSummary = computed(() => {
      const firstMessage = currentChat.value.messages.find((msg) => msg.role === 'user');
      if (firstMessage) {
        const content = firstMessage.content;
        // 简单概括：取前 20 个字符
        return content.slice(0, 20) + (content.length > 20 ? '...' : '');
      }
      return '';
    });

    // 发送消息
    const sendMessage = async () => {
      if (!inputText.value.trim() || isLoading.value) return; // 空内容或加载中不发送

      isLoading.value = true; // 开始加载
      errorMessage.value = ''; // 清空错误信息

      // 添加用户消息到当前对话
      currentChat.value.messages.push({ role: 'user', content: inputText.value });

      try {
        // 发送请求到后端
        const response = await axios.get(`http://127.0.0.1:8060/api/chat/Qwencompletions`, {
          params: {
            model: 'moonshot-v1-8k',
            question: inputText.value,
          },
        });

        // 处理返回结果
        if (response.data.code === 1) {
          // 添加模型回复到当前对话
          currentChat.value.messages.push({ role: 'assistant', content: response.data.data });
        } else if (response.data.data.includes('EVA: error')) {
          // 显示错误信息
          errorMessage.value = '当前系统繁忙，请稍后再试';
        }
      } catch (error) {
        // 捕获请求错误
        if (error.response && error.response.data) {
          const data = error.response.data;
          if (data.data && data.data.includes('request reached organization max RPM')) {
            errorMessage.value = '当前系统繁忙，请稍后再试';
          } else {
            errorMessage.value = '请求失败，请稍后重试';
          }
        } else {
          errorMessage.value = '网络错误，请检查连接';
        }
      } finally {
        isLoading.value = false; // 结束加载
        inputText.value = ''; // 清空输入框
        scrollToBottom(); // 滚动到底部
      }
    };

    // 滚动到底部
    const scrollToBottom = () => {
      const chatHistory = document.querySelector('.chat-history');
      if (chatHistory) {
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }
    };

    // 开始新对话
    const startNewChat = () => {
      chatHistory.value.push({ messages: [] }); // 添加新对话
      currentChatIndex.value = chatHistory.value.length - 1; // 切换到新对话
    };

    // 切换对话
    const switchChat = (index) => {
      currentChatIndex.value = index; // 更新当前对话索引
    };

    // 渲染 Markdown 内容
    const renderMarkdown = (content) => {
      return md.render(content); // 使用 markdown-it 渲染 Markdown
    };

    // 复制到剪贴板
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text).then(() => {
        alert('已复制到剪贴板！');
      }).catch(() => {
        alert('复制失败，请手动复制。');
      });
    };

    return {
      inputText,
      isLoading,
      errorMessage,
      chatHistory,
      currentChatIndex,
      currentChat,
      currentSummary,
      sendMessage,
      startNewChat,
      switchChat,
      renderMarkdown,
      copyToClipboard,
    };
  },
};
</script>

<style>
.chat-app {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.current-summary {
  padding: 10px;
  background-color: #f1f1f1;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  color: #333;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.message {
  margin-bottom: 15px;
  position: relative;
}

.message.user {
  text-align: right;
}

.message.assistant {
  text-align: left;
}

.role {
  font-weight: bold;
  margin-bottom: 5px;
}

.content {
  display: inline-block;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #e0e0e0;
  position: relative;
}

.message.user .content {
  background-color: #007bff;
  color: white;
}

.message.assistant .content {
  background-color: #f1f1f1;
  color: #333;
}

/* 复制按钮样式 */
.copy-button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #0c0606;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.message.assistant .content:hover .copy-button {
  opacity: 1;
}

.error-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
  text-align: center;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 20px;
  background-color: #fff;
}

.chat-input textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  resize: none;
  min-height: 100px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chat-input button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #1554ca;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.chat-input button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.chat-input button:hover:not(:disabled) {
  background-color: #acf0e9;
}
</style>