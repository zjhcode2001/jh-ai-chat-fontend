<template>
    <div class="chat-app">
      <div class="chat-container">
        <div class="chat-history">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.role]"
          >
            <span class="role">{{ message.role === 'user' ? '你' : 'AI' }}:</span>
            <div class="content">{{ message.content }}</div>
          </div>
        </div>
  
        <div class="chat-input">
          <input
            type="file"
            @change="handleFileUpload"
            ref="fileInput"
          />
          <select v-model="selectedModel">
            <option value="qwen-plus">qwen-plus</option>
            <option value="qwen-max">qwen-max</option>
            <option value="deepseek-r1">deepseek-r1</option>
            <option value="deepseek-v3">deepseek-v3</option>
          </select>
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
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        inputText: '',
        isLoading: false,
        messages: [],
        file: null,
        selectedModel: 'qwen-plus',
        sessionId: '',
        eventSource: null, // EventSource 对象
      };
    },
    methods: {
      handleFileUpload(event) {
        this.file = event.target.files[0];
      },
      async sendMessage() {
        if (!this.inputText.trim() || this.isLoading) return;
  
        this.isLoading = true;
        this.messages.push({ role: 'user', content: this.inputText });
  
        const formData = new FormData();
        if (this.file) {
          formData.append('file', this.file);
        }
        formData.append('question', this.inputText);
        formData.append('modelName', this.selectedModel);
        formData.append('sessionId', this.generateSessionId());
  
        try {
          // 发送请求并获取 SSE 流
          const response = await axios.post('http://localhost:8060/file/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          // 关闭之前的 EventSource（如果存在）
          if (this.eventSource) {
            this.eventSource.close();
          }
  
          // 创建新的 EventSource
          this.eventSource = new EventSource(response.data.url);
  
          // 监听 SSE 事件
          this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.role === 'assistant') {
              this.messages.push({ role: 'assistant', content: data.content });
            }
          };
  
          // 监听错误事件
          this.eventSource.onerror = (error) => {
            console.error('EventSource 错误:', error);
            this.messages.push({ role: 'assistant', content: '请求失败，请稍后重试' });
            this.isLoading = false;
          };
        } catch (error) {
          this.messages.push({ role: 'assistant', content: '请求失败，请稍后重试' });
          console.error('上传文件失败:', error);
        } finally {
          this.inputText = '';
          this.file = null;
        }
      },
      generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      },
    },
    beforeUnmount() {
      // 组件销毁时关闭 EventSource
      if (this.eventSource) {
        this.eventSource.close();
      }
    },
  };
  </script>
  
  <style>
  .chat-app {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
    background-color: #f5f7fa;
  }
  
  .chat-container {
    width: 100%;
    max-width: 800px;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 20px;
  }
  
  .chat-history {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
  }
  
  .message {
    margin-bottom: 10px;
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
    padding: 10px;
    border-radius: 5px;
    background-color: #ebedef;
  }
  
  .message.user .content {
    background-color: #dcf8c6;
  }
  
  .chat-input {
    display: flex;
    gap: 10px;
  }
  
  .chat-input input[type="file"] {
    margin-right: 10px;
  }
  
  .chat-input textarea {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    resize: none;
    min-height: 100px;
  }
  
  .chat-input button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background-color: #1554ca;
    color: white;
    cursor: pointer;
    font-size: 16px;
  }
  
  .chat-input button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  </style>