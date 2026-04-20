import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['contained', 'contained-grey', 'outlined', 'outline', 'chip', 'light'],
    },
    color: {
      control: 'select',
      options: ['primary', 'red', 'blue', 'green', 'cancel', 'grey', 'white', 'black', 'yellow'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'mini'],
    },
    pill: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: {
    label: 'Button',
    variant: 'contained',
    color: 'primary',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Outlined: Story = {
  args: { variant: 'outlined' },
};

export const Danger: Story = {
  args: { color: 'red', label: 'Delete' },
};

export const Loading: Story = {
  args: { isLoading: true, label: 'Saving…' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const SmallOutlined: Story = {
  args: { variant: 'outlined', size: 'sm', label: 'Edit' },
};
