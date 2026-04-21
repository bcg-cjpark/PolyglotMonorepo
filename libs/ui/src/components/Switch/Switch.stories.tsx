import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
  args: {
    size: 'md',
    checked: false,
    disabled: false,
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
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const On: Story = {
  args: { checked: true },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const SmallOn: Story = {
  args: { size: 'sm', checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledOn: Story = {
  args: { disabled: true, checked: true },
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch {...args} size="sm" checked={false} />
        <span>Small Off</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch {...args} size="sm" checked={true} />
        <span>Small On</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch {...args} size="md" checked={false} />
        <span>Medium Off</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Switch {...args} size="md" checked={true} />
        <span>Medium On</span>
      </div>
    </div>
  ),
};
