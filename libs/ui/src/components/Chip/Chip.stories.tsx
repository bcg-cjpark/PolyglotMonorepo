import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['grey', 'red', 'green', 'blue', 'yellow', 'purple'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    rounded: {
      control: 'select',
      options: ['rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-full'],
    },
    fontWeight: {
      control: 'select',
      options: ['font-normal', 'font-medium', 'font-semibold', 'font-bold'],
    },
    backgroundColor: { control: 'text' },
    textColor: { control: 'text' },
    borderColor: { control: 'text' },
  },
  args: {
    label: 'Chip',
    variant: 'grey',
    size: 'md',
    rounded: 'rounded-sm',
    fontWeight: 'font-normal',
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm', label: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', label: 'Large' },
};

export const Pill: Story = {
  args: { rounded: 'rounded-full', label: 'Pill', variant: 'blue' },
};

export const Bold: Story = {
  args: { fontWeight: 'font-bold', label: 'Bold', variant: 'red' },
};

export const CustomColor: Story = {
  args: {
    label: 'Custom',
    backgroundColor: '#0ea5e9',
    textColor: '#ffffff',
    borderColor: '#0284c7',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['grey', 'red', 'green', 'blue', 'yellow', 'purple'] as const).map((v) => (
        <Chip key={v} variant={v} label={v} />
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Chip size="sm" variant="blue" label="sm" />
      <Chip size="md" variant="blue" label="md" />
      <Chip size="lg" variant="blue" label="lg" />
    </div>
  ),
};
