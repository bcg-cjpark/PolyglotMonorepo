import type { Preview } from '@storybook/react-vite';

// tailwind-config/globals.css 가 이미 @monorepo/tokens 를 @import 로 끌어오므로
// 여기서 tokens 를 별도로 import 하면 Tailwind v4 가 @theme inline 블록을 두 번째 graph 로 인식해 utility 가 누락됨.
// globals 한 줄만 두어 단일 CSS graph 를 유지.
import '@monorepo/tailwind-config/globals';
import '../src/styles/components.scss';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Light / Dark 테마 토글. `data-theme` 속성으로 토큰 스코프 전환.',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'light';
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
      return Story();
    },
  ],
};

export default preview;
