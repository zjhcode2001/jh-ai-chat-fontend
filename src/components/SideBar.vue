<template>
    <div class="sidebar">
      <button class="new-chat-button" @click="startNewChat">
        + 新对话
      </button>
      <div class="chat-list">
        <div
          v-for="(chat, index) in chatHistory"
          :key="index"
          :class="['chat-item', { active: currentChatIndex === index }]"
          @click="switchChat(index)"
        >
          {{ summarizeChat(chat.messages) }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      chatHistory: {
        type: Array,
        required: true,
      },
      currentChatIndex: {
        type: Number,
        required: true,
      },
    },
    emits: ['start-new-chat', 'switch-chat'],
    methods: {
      startNewChat() {
        this.$emit('start-new-chat');
      },
      switchChat(index) {
        this.$emit('switch-chat', index);
      },
      // 概括对话内容
      summarizeChat(messages) {
        const firstMessage = messages.find((msg) => msg.role === 'user');
        if (firstMessage) {
          const content = firstMessage.content;
          // 简单概括：取前 20 个字符
          return content.slice(0, 20) + (content.length > 20 ? '...' : '');
        }
        return '新对话';
      },
    },
  };
  </script>
  
  <style scoped>
  .sidebar {
    width: 250px;
    background-color: #2c3e50;
    color: white;
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  }
  
  .new-chat-button {
    padding: 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    margin-bottom: 20px;
    transition: background-color 0.3s ease;
  }
  
  .new-chat-button:hover {
    background-color: #2980b9;
  }
  
  .chat-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .chat-item {
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    background-color: #34495e;
  }
  
  .chat-item:hover {
    background-color: #3b4f63;
  }
  
  .chat-item.active {
    background-color: #3498db;
    color: white;
  }
  </style>