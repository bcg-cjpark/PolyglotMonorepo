import type { Meta, StoryObj } from '@storybook/react-vite';
import { Disclosure } from './Disclosure';

const meta: Meta<typeof Disclosure> = {
  title: 'Components/Disclosure',
  component: Disclosure,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['red', 'blue', 'gray', 'purple'],
    },
    defaultOpen: { control: 'boolean' },
    custom: { control: 'boolean' },
    showArrow: { control: 'boolean' },
    arrowPosition: { control: { type: 'number', min: 0, max: 48, step: 2 } },
    buttonText: { control: 'text' },
    panelContent: { control: 'text' },
    // renderButton/renderPanel 는 ReactNode 복합 객체라 controls 에서 제외.
    renderButton: { control: false },
    renderPanel: { control: false },
  },
  args: {
    buttonText: '자세히 보기',
    panelContent:
      '여기는 아코디언 패널 본문입니다. 임의의 설명 텍스트를 배치할 수 있습니다.',
    color: 'gray',
    defaultOpen: false,
    custom: false,
    showArrow: true,
    arrowPosition: 16,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Disclosure>;

export const Default: Story = {};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
};

export const Blue: Story = {
  args: { color: 'blue', buttonText: '파란 헤더' },
};

export const Red: Story = {
  args: { color: 'red', buttonText: '빨간 헤더' },
};

export const Purple: Story = {
  args: { color: 'purple', buttonText: '보라 헤더' },
};

export const CustomRender: Story = {
  args: {
    custom: true,
    showArrow: true,
    renderButton: (
      <div
        style={{
          padding: '12px 16px',
          background: '#f3f4f6',
          borderRadius: 8,
          fontWeight: 600,
        }}
      >
        커스텀 버튼 슬롯
      </div>
    ),
    renderPanel: (
      <div style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>
        커스텀 패널 슬롯 — 자유롭게 ReactNode 를 넣을 수 있습니다.
      </div>
    ),
  },
};
