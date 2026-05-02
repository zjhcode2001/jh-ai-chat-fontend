<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script>
// import ChatPage from './components/ChatPage.vue'
// import ChatPage from './views/ChatView.vue'; 

export default {
  name: 'App'
}
</script>

<style>
:root[data-theme='dark'] {
  --text-main: #edf1ff;
  --text-muted: #a5aecf;
  --card-bg: rgba(17, 20, 30, 0.72);
  --card-border: rgba(255, 255, 255, 0.1);
  --panel-bg: rgba(255, 255, 255, 0.06);
  --input-bg: rgba(255, 255, 255, 0.04);
  --input-border: rgba(255, 255, 255, 0.14);
  --input-bg-focus: rgba(255, 255, 255, 0.07);
  --focus-border: rgba(172, 186, 255, 0.6);
  --focus-shadow: rgba(148, 166, 255, 0.18);
  --button-bg: linear-gradient(180deg, #f8f9ff 0%, #e8ecff 100%);
  --button-text: #11131e;
  --chat-text-main: #e9ecf8;
  --chat-text-muted: #9aa5ca;
  --chat-card-bg: rgba(15, 18, 27, 0.72);
  --chat-card-border: rgba(255, 255, 255, 0.08);
  --chat-panel-bg: rgba(255, 255, 255, 0.04);
  --chat-panel-bg-hover: rgba(255, 255, 255, 0.07);
  --chat-input-border: rgba(255, 255, 255, 0.16);
  --chat-focus-border: rgba(170, 186, 255, 0.56);
  --chat-focus-shadow: rgba(142, 160, 255, 0.16);
  --chat-button-bg: linear-gradient(180deg, #f7f9ff 0%, #e6ebff 100%);
  --chat-button-text: #101320;
  --chat-user-bubble-bg: linear-gradient(180deg, rgba(210, 221, 255, 0.94) 0%, rgba(191, 205, 255, 0.88) 100%);
  --chat-user-bubble-text: #101321;
  --chat-assistant-bubble-bg: rgba(255, 255, 255, 0.04);
  --chat-bg-base: #090b12;
  --chat-bg-glow-1: rgba(91, 109, 255, 0.24);
  --chat-bg-glow-2: rgba(49, 61, 111, 0.3);
}

:root[data-theme='light'] {
  --text-main: #111827;
  --text-muted: #4b5563;
  --card-bg: rgba(255, 255, 255, 0.86);
  --card-border: rgba(17, 24, 39, 0.12);
  --panel-bg: rgba(17, 24, 39, 0.06);
  --input-bg: rgba(255, 255, 255, 0.95);
  --input-border: rgba(17, 24, 39, 0.18);
  --input-bg-focus: #ffffff;
  --focus-border: rgba(79, 70, 229, 0.6);
  --focus-shadow: rgba(99, 102, 241, 0.2);
  --button-bg: linear-gradient(180deg, #111827 0%, #1f2937 100%);
  --button-text: #f9fafb;
  --chat-text-main: #111827;
  --chat-text-muted: #4b5563;
  --chat-card-bg: rgba(255, 255, 255, 0.92);
  --chat-card-border: rgba(17, 24, 39, 0.14);
  --chat-panel-bg: rgba(17, 24, 39, 0.04);
  --chat-panel-bg-hover: rgba(17, 24, 39, 0.08);
  --chat-input-border: rgba(17, 24, 39, 0.2);
  --chat-focus-border: rgba(79, 70, 229, 0.52);
  --chat-focus-shadow: rgba(99, 102, 241, 0.18);
  --chat-button-bg: linear-gradient(180deg, #111827 0%, #1f2937 100%);
  --chat-button-text: #f9fafb;
  --chat-user-bubble-bg: linear-gradient(180deg, #dde6ff 0%, #cad7ff 100%);
  --chat-user-bubble-text: #111827;
  --chat-assistant-bubble-bg: rgba(17, 24, 39, 0.04);
  --chat-bg-base: #f6f8ff;
  --chat-bg-glow-1: rgba(99, 102, 241, 0.18);
  --chat-bg-glow-2: rgba(56, 189, 248, 0.16);
}

#app {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #e9ecf8;
  margin-top: 0;
}
</style>
