import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'search', 'password', 'password-strength', 'tel', 'number'],
    },
    size: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    error: { control: 'boolean' },
    full: { control: 'boolean' },
    allowSpaces: { control: 'boolean' },
  },
  args: {
    placeholder: 'Type here…',
    size: 'md',
    variant: 'default',
    full: true,
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState(ctx.args.value ?? '');
      return (
        <div style={{ width: 320 }}>
          <Story args={{ ...ctx.args, value, onChange: setValue }} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithSpaces: Story = {
  args: { allowSpaces: true, placeholder: 'Full name' },
};

export const Search: Story = {
  args: { variant: 'search', placeholder: 'Search…' },
};

export const Password: Story = {
  args: { variant: 'password', placeholder: 'Password' },
};

export const PasswordStrength: Story = {
  args: { variant: 'password-strength', placeholder: 'Strong password' },
};

export const Error: Story = {
  args: { error: true, errorMessage: 'This field is required', value: '' },
};

export const Disabled: Story = {
  args: { disabled: true, value: 'Disabled value' },
};
