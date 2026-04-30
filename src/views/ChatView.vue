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
            当前对话 · {{ currentSummary }}
          </div>
  
          <!-- 模型选择下拉框 -->
          <div class="model-selector">
            <select id="model-select" v-model="selectedModel">
              <option v-for="model in models" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
          </div>
  
          <!-- 对话记录区域 -->
          <div class="chat-history">
            <div v-for="(message, index) in sortedMessages" :key="index" :class="['message', message.role]">
              <span class="role">{{ message.role === 'user' ? '你' : 'AI' }}:</span>
              <div class="content">
                <!-- 复制按钮 -->
                <button
                  class="copy-button"
                  @click="copyToClipboard(message.content)"
                  title="复制"
                >
                  复制
                </button>
  
                <!-- 回复内容 逐步渲染的 -->
                <div v-html="renderMarkdown(message.content)"></div>
              </div>
            </div>
  
            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </div>
  
          <!-- 输入框和发送/中止按钮 -->
          <div class="chat-input">
            <textarea
              v-model="inputText"
              @keyup.enter="sendMessage"
              placeholder="给 AI 发送消息..."
              :disabled="isLoading"
            ></textarea>
            <button @click="sendMessage" :disabled="isLoading || isStopping">
              {{ isLoading ? '发送中...' : '发送' }}
            </button>
            <button @click="stopGenerating" :disabled="!isLoading || isStopping">
              {{ isStopping ? '正在中止...' : '中止生成' }}
            </button>
          </div>
        </div>

        <!-- 用户名显示和退出登录按钮 -->
        <div class="user-info">
            <span>{{ username }}</span>
            <button @click="toggleTheme">
              {{ isDark ? '白天模式' : '黑夜模式' }}
            </button>
            <button @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  import MarkdownIt from 'markdown-it';
  import SideBar from '@/components/SideBar.vue'; // 引入侧边栏组件
  import { useTheme } from '@/composables/useTheme';
  import axios from 'axios';
  
  export default {
    components: {
      SideBar
    },
    props: {
        username: {
            type: String,
            required: true
        }
    },
    setup() {
      const { isDark, toggleTheme } = useTheme();

      // 生成唯一 sessionId 的函数
      const generateSessionId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      };
  
      const inputText = ref(''); // 输入框内容
      const isLoading = ref(false); // 加载状态
      const isStopping = ref(false); // 中止状态
      const errorMessage = ref(''); // 错误信息
      let eventSource = null; // EventSource 对象
  
      const models = ['qwen-plus', 'qwen-max', 'deepseek-r1', 'deepseek-v3'];
      const selectedModel = ref('qwen-plus');
  
      // 初始化 markdown-it
      const md = new MarkdownIt();
  
      let userId = "101"; // 用户ID就是登录时的用户名
  
      // 预设一组 sessionId 可以设置成，响应式的
      let presetSessionIds = [
        // 'm8fkb88gfy8mv3g1j',
        // 'm8ha2ohrdhn7ye5aq',
        // 'session3'
      ];
  
      // 对话历史记录
      const chatHistory = ref([
        {
          sessionId: presetSessionIds[0],
          messages: [
  
          ]
        }
      
      ]);
      const currentChatIndex = ref(0); // 当前对话的索引
  
      // 当前对话
      const currentChat = computed(() => chatHistory.value[currentChatIndex.value]);
  
      // 获取当前对话的概括
      const currentSummary = computed(() => {
        if (!currentChat.value || !currentChat.value.messages) return '';
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
        console.log(selectedModel.value);
  
        if (!inputText.value.trim() || isLoading.value) return; // 空内容或加载中不发送
  
        isLoading.value = true; // 开始加载
        errorMessage.value = ''; // 清空错误信息
        isStopping.value = false; // 关闭之前的连接（如果存在）
  
        // 添加用户消息到当前对话
        currentChat.value.messages.push({ role: 'user', content: inputText.value, timestamp: new Date().toISOString() });
  
        try {
          // 创建 EventSource 对象
          eventSource = new EventSource(`http://localhost:8060/chat/stream?modelName=${encodeURIComponent(selectedModel.value)}&question=${encodeURIComponent(inputText.value)}&sessionId=${encodeURIComponent(currentChat.value.sessionId)}`);
  
          // 添加 AI 回复占位符
          const assistantMessage = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
          currentChat.value.messages.push(assistantMessage);
  
          // 监听自定义事件 sse-event
          eventSource.addEventListener('sse-event', (event) => {
            try {
              // 解析数据
              const data = JSON.parse(event.data); // 解析为 { role: 'assistant', content: '大' }
              if (data.role === 'assistant' && data.content) {
                assistantMessage.content += data.content; // 逐步更新 AI 回复内容
  
                // 通过索引更新 messages 数组中的特定项以确保视图更新 以达成流式输出的效果
                const index = currentChat.value.messages.length - 1;
                // 使用 splice 方法更新数组中的指定元素
                currentChat.value.messages.splice(index, 1, { ...assistantMessage });
              }
  
            } catch (error) {
              console.error('解析数据失败:', error);
            }
            scrollToBottom();
          });
  
          // 监听打开连接
          eventSource.onopen = function () {
            console.log('Connection to server opened.');
          };
  
          // 监听错误
          eventSource.onerror = function (event) {
            console.error('EventSource 错误:', event);
            // errorMessage.value = '请求失败，请稍后重试';
            sendMessage();
            isLoading.value = false; // 结束加载
            eventSource.close(); // 关闭连接
          };
  
          // 监听流式结束
          eventSource.addEventListener('close', function () {
            isLoading.value = false; // 结束加载
            eventSource.close(); // 关闭连接
          });
  
        } catch (error) {
          errorMessage.value = '请求失败，请稍后重试';
          isLoading.value = false; // 结束加载
        } finally {
          inputText.value = ''; // 清空输入框
        }
      };
  
      // 中止生成
      const stopGenerating = () => {
        if (eventSource) {
          isStopping.value = true;
          eventSource.close(); // 关闭连接
          isLoading.value = false; // 结束加载
          isStopping.value = false; // 重置中止状态
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
        const newSessionId = generateSessionId(); // 新增 sessionId 字段
        chatHistory.value.push({
          sessionId: newSessionId,
          messages: [],
        }); // 添加新对话
        currentChatIndex.value = chatHistory.value.length - 1; // 切换到新对话
      };
  
      // 切换对话
      const switchChat = async (index) => {
        currentChatIndex.value = index; // 更新当前对话索引
        await fetchChatHistoryBySessionId(chatHistory.value[index].sessionId);
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
  
      // 根据时间排序消息
      const sortedMessages = computed(() => {
        if (!currentChat.value || !currentChat.value.messages) return [];
        return [...currentChat.value.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
  
      // 从后端获取聊天历史
      const fetchChatHistoryBySessionId = async (sessionId) => {
  
        try {
          const response = await axios.get(`http://localhost:8060/chat/getChatHistory?sessionId=${encodeURIComponent(sessionId)}`);
          let chatHistories = response.data;
          // console.log(typeof(chatHistories));
          // 确保 chatHistories 是一个数组
          if (!Array.isArray(chatHistories)) {
            chatHistories = [chatHistories];
          }
          
          // console.log('chatHistory:', chatHistories[0].data[1].content);
          let messagesWithTimestamps = []
          chatHistories[0].data.forEach((message) => {
            messagesWithTimestamps.push({
              role: message.role,
              content: message.content,
              timestamp: message.timestamp,
            });
          })
          // console.log('messagesWithTimestamps:', messagesWithTimestamps);
  
          const existingChatIndex = chatHistory.value.findIndex(chat => chat.sessionId === sessionId);
  
          if (existingChatIndex !== -1) {
            chatHistory.value[existingChatIndex].messages = messagesWithTimestamps;
          } else {
            chatHistory.value.push({ sessionId, messages: messagesWithTimestamps });
          }
          
        } catch (error) {
          console.error('获取聊天历史失败:', error);
          errorMessage.value = '获取聊天历史失败，请稍后重试';
        }
      };


  
      // 初始化时获取预设的聊天历史
      onMounted(async () => {
        console.log("用户ID:", userId);
        let sessionList = await axios.get(`http://localhost:8060/chat/getSessionByUser?userId=${encodeURIComponent(userId)}`);
        console.log(sessionList.data.data);
        presetSessionIds = sessionList.data.data;
        
  
        for (const sessionId of presetSessionIds) {
          await fetchChatHistoryBySessionId(sessionId);
        }
        // 设置默认当前对话为第一个对话
        if (chatHistory.value.length > 0) {
          currentChatIndex.value = 0;
        } else {
          // 如果没有历史对话，则创建一个新的对话
          startNewChat();
        }
      });


  
      return {
        isDark,
        toggleTheme,
        inputText,
        isLoading,
        isStopping,
        errorMessage,
        chatHistory,
        currentChatIndex,
        models,
        selectedModel,
        currentChat,
        currentSummary,
        sendMessage,
        stopGenerating,
        startNewChat,
        switchChat,
        renderMarkdown,
        copyToClipboard,
        sortedMessages,
        
      };
    },
  };
  </script>
  
  
  
  <style>
  .chat-app {
    display: flex;
    height: 100dvh;
    width: 100%;
    background:
      radial-gradient(1200px 600px at 65% -10%, rgba(91, 109, 255, 0.24), transparent 55%),
      radial-gradient(900px 500px at 10% 100%, rgba(49, 61, 111, 0.3), transparent 55%),
      #090b12;
    color: var(--chat-text-main);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    width: 100%;
    justify-content: center;
    padding: 20px;
    position: relative;
  }
  
  .chat-container {
    width: 100%;
    max-width: 920px;
    display: flex;
    flex-direction: column;
    background: var(--chat-card-bg);
    border-radius: 16px;
    border: 1px solid var(--chat-card-border);
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(10px);
    overflow: hidden;
  }
  
  .current-summary {
    padding: 14px 20px 12px;
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 13px;
    letter-spacing: 0.01em;
    color: var(--chat-text-muted);
  }
  
  .model-selector {
    padding: 14px 20px 10px;
    text-align: left;
  }
  
  .model-selector select {
    min-width: 160px;
    padding: 8px 12px;
    border: 1px solid var(--chat-input-border);
    border-radius: 10px;
    background: var(--chat-panel-bg);
    color: var(--chat-text-main);
    font-size: 13px;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }
  
  .model-selector select:focus {
    outline: none;
    border-color: var(--chat-focus-border);
    background: var(--chat-panel-bg-hover);
  }
  
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 8px 20px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .message {
    margin-bottom: 14px;
    position: relative;
  }
  
  .message.user {
    text-align: end;
  }
  
  .message.assistant {
    text-align: start;
  }
  
  .role {
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--chat-text-muted);
    font-size: 12px;
    letter-spacing: 0.01em;
  }
  
  .content {
    display: inline-block;
    max-width: min(82ch, 100%);
    padding: 12px 14px;
    border-radius: 12px;
    position: relative;
    word-break: break-word;
    line-height: 1.6;
    font-size: 14px;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
  }
  
  .message.user .content {
    background: var(--chat-user-bubble-bg);
    color: var(--chat-user-bubble-text);
    box-shadow: 0 12px 24px rgba(38, 62, 145, 0.2);
  }
  
  .message.assistant .content {
    background: var(--chat-assistant-bubble-bg);
    border: 1px solid var(--chat-card-border);
    color: var(--chat-text-main);
  }

  .message .content:hover {
    transform: translateY(-1px);
  }
  
  .copy-button {
    position: absolute;
    top: 6px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--chat-text-muted);
    opacity: 0;
    transition: opacity 0.2s ease, color 0.2s ease;
  }
  
  .message.assistant .content:hover .copy-button {
    opacity: 1;
  }

  .copy-button:hover {
    color: var(--chat-text-main);
  }
  
  .error-message {
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 107, 107, 0.12);
    color: #ffb1b1;
    text-align: center;
    border: 1px solid rgba(255, 107, 107, 0.28);
  }
  
  .chat-input {
    display: flex;
    gap: 10px;
    padding: 16px 20px 18px;
    background: rgba(7, 10, 17, 0.45);
  }
  
  .chat-input textarea {
    flex: 1;
    padding: 12px 14px;
    border: 1px solid var(--chat-input-border);
    border-radius: 10px;
    font-size: 14px;
    resize: none;
    min-height: 84px;
    background: var(--chat-panel-bg);
    color: var(--chat-text-main);
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  }

  .chat-input textarea::placeholder {
    color: var(--chat-text-muted);
  }

  .chat-input textarea:focus {
    outline: none;
    border-color: var(--chat-focus-border);
    box-shadow: 0 0 0 3px var(--chat-focus-shadow);
    background: var(--chat-panel-bg-hover);
  }
  
  .chat-input button {
    padding: 0 16px;
    border: none;
    border-radius: 10px;
    background: var(--chat-button-bg);
    color: var(--chat-button-text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.25s ease;
  }
  
  .chat-input button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .chat-input button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(153, 169, 247, 0.34);
  }

  .user-info {
    position: absolute;
    top: 14px;
    right: 26px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info span {
    color: var(--chat-text-muted);
  }

  .user-info button {
    background: transparent;
    border: 1px solid var(--chat-input-border);
    border-radius: 8px;
    color: var(--chat-text-main);
    cursor: pointer;
    font-size: 12px;
    padding: 6px 10px;
    transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
  }

  .user-info button:hover {
    border-color: var(--chat-focus-border);
    color: var(--chat-text-main);
    background: var(--chat-panel-bg-hover);
  }

  @media (max-width: 900px) {
    .main-content {
      padding: 12px;
    }

    .chat-input {
      flex-wrap: wrap;
    }

    .chat-input button {
      height: 40px;
    }
  }
  </style>