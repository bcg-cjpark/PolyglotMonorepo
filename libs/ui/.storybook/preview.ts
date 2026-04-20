import type { Preview } from '@storybook/react-vite';

import '@monorepo/tokens/styles.css';
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
};

export default preview;
