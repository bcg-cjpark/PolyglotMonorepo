import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
    label: { control: 'text' },
    color: { control: 'color' },
    backgroundColor: { control: 'color' },
    padding: { control: 'text' },
    disabled: { control: 'boolean' },
    ariaLabel: { control: 'text' },
    className: { control: 'text' },
    // 복합 객체 prop 은 story args 로 프리셋 주입
    icon: { control: false },
    badge: { control: false },
    onClick: { action: 'clicked' },
  },
  args: {
    icon: { name: 'heart' },
    size: 'md',
    shape: 'circle',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const Square: Story = {
  args: { shape: 'square' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const WithLabelRight: Story = {
  args: { label: '좋아요', labelPosition: 'right' },
};

export const WithLabelBottom: Story = {
  args: { label: '좋아요', labelPosition: 'bottom' },
};

export const WithBackground: Story = {
  args: {
    backgroundColor: 'var(--background-primary, #2563eb)',
    color: '#fff',
    icon: { name: 'plus' },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithBadge: Story = {
  args: {
    icon: { name: 'notification' },
    badge: { value: 5, show: true, color: 'red' },
  },
};

export const WithBadgeOverflow: Story = {
  args: {
    icon: { name: 'notification' },
    badge: { value: 150, max: 99, show: true, color: 'red' },
  },
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <IconButton {...args} size="sm" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
    </div>
  ),
};
