# ai-chat

## Project structure

- `src/views/LoginView.vue`: 登录首页（极简深色风格）
- `src/views/ChatView.vue`: 主聊天页（对话区、模型选择、输入区）
- `src/components/SideBar.vue`: 会话列表与新建对话入口
- `src/router/index.js`: 路由配置（`/` 登录，`/chat` 聊天）

## UI style

- 采用 Minimalist Dark Mode 设计语言，突出留白、弱对比层级和细腻动效。
- 支持白天/黑夜模式一键切换，并将主题偏好持久化到浏览器本地存储。
- 左侧会话列表可折叠收起，收起后主聊天区自动占满剩余宽度（折叠状态可持久化）。
- 保持前后端接口调用路径与参数不变，界面改造不影响聊天与登录流程。

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
