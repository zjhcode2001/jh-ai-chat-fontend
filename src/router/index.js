import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ChatView from '../views/ChatView.vue';
// import FileUpload from '../views/FileUpload.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
    props: route => ({ username: route.query.username })
  },
//    {
//     path: '/upload',
//     name: 'FileUpload',
//     component: FileUpload
//   }
];

const router = createRouter({
  history: createWebHistory("/"),
  routes
});

export default router;