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
    flex: 1;
    min-height: 0;
    width: 100%;
    background: transparent;
    color: var(--chat-text-main);
    padding: 12px 14px 20px;
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(10px);
  }

  .new-chat-button {
    width: 100%;
    padding: 12px 14px;
    background: var(--chat-button-bg);
    color: var(--chat-button-text);
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    letter-spacing: 0.01em;
    transition: transform 0.2s ease, box-shadow 0.25s ease, opacity 0.25s ease;
  }

  .new-chat-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(147, 162, 255, 0.35);
  }

  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .chat-item {
    padding: 11px 12px;
    margin-bottom: 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    background: var(--chat-panel-bg);
    color: var(--chat-text-muted);
    font-size: 13px;
    line-height: 1.4;
  }

  .chat-item:hover {
    background: var(--chat-panel-bg-hover);
    color: var(--chat-text-main);
    transform: translateX(2px);
  }

  .chat-item.active {
    background: var(--chat-panel-bg-hover);
    color: var(--chat-text-main);
    border: 1px solid var(--chat-focus-border);
  }
  </style>