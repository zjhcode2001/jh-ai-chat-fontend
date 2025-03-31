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
              placeholder="请输入你的问题..."
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
            <button @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  import MarkdownIt from 'markdown-it';
  import SideBar from '../components/SideBar.vue'; // 引入侧边栏组件
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
    height: 100vh;
    width: 100%;
    background-color: #f5f7fa;
  }
  
  .main-content {
    flex: 1;
    display: flex;
    width: 100%;
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
    padding: 15px;
    background-color: #ebedef;
    border-bottom: 1px solid #ddd;
    font-size: 14px;
    color: #333;
  }
  
  .model-selector {
    padding: 10px;
    text-align: left;
  }
  
  .model-selector select {
    padding: 5px;
    border: none;
    font-size: 16px;
    font-family: '楷体', self; /*设置字体为楷体 */
  }
  
  .model-selector select option {
    font-size: 16px; /* 设置字体大小 */
    font-family: '楷体', serif; /* 设置字体为楷体 */
    padding: 5px 10px; /* 添加一些内边距 */
  }
  
  .model-selector label {
    font-weight: bold;
    margin-right: 10px;
    cursor: pointer; /* 将鼠标指针更改为手形 */
    padding: 5px 10px; /* 添加一些内边距 */
    border: 1px solid #ccc; /* 添加一个边框 */
    border-radius: 4px; /* 添加圆角 */
    background-color: #f0f0f0; /* 添加一个背景颜色 */
    transition: background-color 0.3s; /* 添加一个过渡效果 */
  }
  
  .model-selector label:hover {
    background-color: #e0e0e0; /* 添加一个悬停效果 */
  }
  
  .chat-history {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    border-bottom: 1px solid #ddd;
  }
  
  .message {
    margin-bottom: 20px;
    position: relative;
  }
  
  .message.user {
    text-align: end;
  }
  
  .message.assistant {
    text-align: start;
  }
  
  .role {
    font-weight: bold;
    margin-bottom: 5px;
    color: #5d6a76;
  }
  
  .content {
    display: inline-block;
    padding: 12px 16px;
    border-radius: 12px;
    background-color: #ebedef;
    position: relative;
    word-wrap: break-word;
  }
  
  .message.user .content {
    background-color: #dcf8c6;
    color: #13ce66;
  }
  
  .message.assistant .content {
    background-color: #ebedef;
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
    outline: none;
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
    background-color: #003d99;
  }

  .user-info {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
  color: #333;
}

.user-info button {
  background-color: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  font-size: 16px;
}

.user-info button:hover {
  color: #0056b3;
}
  </style>