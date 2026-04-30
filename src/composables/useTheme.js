import { ref, onMounted } from 'vue';

const THEME_KEY = 'ai-chat-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

/**
 * 方法说明: useTheme
 * 输入参数: 无
 * 输出参数: { theme, isDark, toggleTheme, applyTheme }
 * 核心逻辑: 管理全局主题状态, 并将主题同步到 document 根节点与本地存储
 * 请求示例: 无
 * 响应示例: { theme: "dark", isDark: true }
 */
export function useTheme() {
  const theme = ref(DARK_THEME);
  const isDark = ref(true);

  /**
   * 方法说明: applyTheme
   * 输入参数: nextTheme(string)
   * 输出参数: 无
   * 核心逻辑: 应用主题到根节点 data-theme 并持久化到 localStorage
   * 请求示例: applyTheme("light")
   * 响应示例: 页面切换到亮色主题
   */
  const applyTheme = (nextTheme) => {
    // Step 1: 标准化并校验主题值
    // Purpose: 防止非法主题值污染页面状态
    const normalizedTheme = nextTheme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
    theme.value = normalizedTheme;
    isDark.value = normalizedTheme === DARK_THEME;

    // Step 2: 应用主题到根节点
    // Purpose: 通过 CSS 变量驱动全局主题渲染
    document.documentElement.setAttribute('data-theme', normalizedTheme);

    // Step 3: 持久化主题
    // Purpose: 页面刷新后保留用户的主题偏好
    localStorage.setItem(THEME_KEY, normalizedTheme);
  };

  /**
   * 方法说明: toggleTheme
   * 输入参数: 无
   * 输出参数: 无
   * 核心逻辑: 在 dark 与 light 主题之间一键切换
   * 请求示例: toggleTheme()
   * 响应示例: dark -> light
   */
  const toggleTheme = () => {
    const nextTheme = isDark.value ? LIGHT_THEME : DARK_THEME;
    applyTheme(nextTheme);
  };

  onMounted(() => {
    // Step 1: 读取历史主题
    // Purpose: 优先使用用户上次选择, 提升一致性体验
    const storedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(storedTheme || DARK_THEME);
  });

  return {
    theme,
    isDark,
    toggleTheme,
    applyTheme
  };
}
