import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
    maxLength: { control: 'number' },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
    full: { control: 'boolean' },
    allowSpaces: { control: 'boolean' },
    className: { control: 'text' },
    id: { control: 'text' },
    name: { control: 'text' },
    ariaLabel: { control: 'text' },
    onChange: { action: 'change' },
    onFocus: { action: 'focus' },
    onBlur: { action: 'blur' },
  },
  args: {
    placeholder: '내용을 입력하세요',
    rows: 4,
    disabled: false,
    error: false,
    full: true,
    allowSpaces: true,
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string>(
        typeof ctx.args.value === 'string' ? ctx.args.value : ''
      );
      return (
        <div style={{ width: 420 }}>
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next: string) => {
                setValue(next);
                ctx.args.onChange?.(next);
              },
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithPlaceholder: Story = {
  args: {
    placeholder: '오늘 있었던 일을 자유롭게 적어보세요…',
  },
};

export const WithMaxLength: Story = {
  args: {
    placeholder: '최대 200자까지 입력 가능합니다',
    maxLength: 200,
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string>(
        typeof ctx.args.value === 'string' ? ctx.args.value : ''
      );
      const max = ctx.args.maxLength ?? 200;
      return (
        <div style={{ width: 420 }}>
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next: string) => {
                setValue(next);
                ctx.args.onChange?.(next);
              },
            }}
          />
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: 'var(--input-color-text-placeholder, #888)',
              textAlign: 'right',
            }}
          >
            <span>
              {value.length}/{max}
            </span>
          </div>
        </div>
      );
    },
  ],
};

export const Error: Story = {
  args: {
    error: true,
    errorMessage: '필수 입력 항목입니다.',
    placeholder: '내용을 입력하세요',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: '비활성화된 입력 필드입니다.\n편집할 수 없습니다.',
  },
};

export const Full: Story = {
  args: {
    full: true,
    placeholder: '가로 100% 로 꽉 채워지는 버전',
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string>(
        typeof ctx.args.value === 'string' ? ctx.args.value : ''
      );
      return (
        <div style={{ width: 640 }}>
          <Story
            args={{
              ...ctx.args,
              value,
              onChange: (next: string) => {
                setValue(next);
                ctx.args.onChange?.(next);
              },
            }}
          />
        </div>
      );
    },
  ],
};

export const KoreanIME: Story = {
  args: {
    placeholder: '한글을 자유롭게 입력해 보세요',
    rows: 5,
  },
};

export const NoSpaces: Story = {
  args: {
    allowSpaces: false,
    placeholder: '공백 입력이 차단됩니다',
  },
};
