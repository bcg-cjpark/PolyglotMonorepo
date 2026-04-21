import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
    },
    width: { control: 'text' },
    height: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    variant: 'text',
    width: '240px',
    height: '1rem',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {};

export const Text: Story = {
  args: { variant: 'text', width: '100%', height: '1rem' },
};

export const Circular: Story = {
  args: { variant: 'circular', width: '56px', height: '56px' },
};

export const Rectangular: Story = {
  args: { variant: 'rectangular', width: '240px', height: '120px' },
};

export const TextBlock: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320 }}>
      <Skeleton variant="text" width="60%" height="1.25rem" />
      <Skeleton variant="text" width="100%" height="1rem" />
      <Skeleton variant="text" width="100%" height="1rem" />
      <Skeleton variant="text" width="80%" height="1rem" />
    </div>
  ),
};

export const AvatarRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 320 }}>
      <Skeleton variant="circular" width="48px" height="48px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton variant="text" width="60%" height="1rem" />
        <Skeleton variant="text" width="40%" height="0.875rem" />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Skeleton variant="text" width="100%" height="1rem" />
      <Skeleton variant="circular" width="48px" height="48px" />
      <Skeleton variant="rectangular" width="100%" height="80px" />
    </div>
  ),
};
