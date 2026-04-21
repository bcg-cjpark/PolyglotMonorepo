import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
    onChange: { action: 'changed' },
  },
  args: {
    size: 'md',
    checked: false,
    indeterminate: false,
    disabled: false,
    children: '동의합니다',
  },
  decorators: [
    (Story, ctx) => {
      const [checked, setChecked] = useState<boolean>(ctx.args.checked ?? false);
      return (
        <Story
          args={{
            ...ctx.args,
            checked,
            onChange: (next: boolean) => {
              setChecked(next);
              ctx.args.onChange?.(next);
            },
          }}
        />
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true, children: '일부 선택됨' },
};

export const Disabled: Story = {
  args: { disabled: true, children: '비활성' },
};

export const DisabledChecked: Story = {
  args: { disabled: true, checked: true, children: '비활성 + 선택됨' },
};

export const WithoutLabel: Story = {
  args: { children: undefined },
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox {...args} size="sm">
        Small 체크박스
      </Checkbox>
      <Checkbox {...args} size="md">
        Medium 체크박스
      </Checkbox>
      <Checkbox {...args} size="lg">
        Large 체크박스
      </Checkbox>
    </div>
  ),
};
