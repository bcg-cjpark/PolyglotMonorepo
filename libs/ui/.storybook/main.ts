import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const uiSrc = path.resolve(dirname, '../src');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(base) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    return {
      ...base,
      plugins: [...(base.plugins ?? []), tailwindcss()],
      resolve: {
        ...base.resolve,
        alias: {
          ...(base.resolve?.alias ?? {}),
          '#': uiSrc,
        },
      },
    };
  },
};

export default config;
