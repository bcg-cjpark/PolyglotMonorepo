import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const Anchor = ({ label = 'Box' }: { label?: string }) => (
  <div
    style={{
      width: 48,
      height: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--base-colors-neutral-neutral200, #e5e7eb)',
      borderRadius: 8,
      fontSize: 12,
    }}
  >
    {label}
  </div>
);

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    max: { control: 'number' },
    variant: {
      control: 'select',
      options: ['dot', 'standard', 'square'],
    },
    color: {
      control: 'select',
      options: ['grey', 'red', 'green', 'blue', 'yellow', 'purple'],
    },
    showZero: { control: 'boolean' },
    hidden: { control: 'boolean' },
    overlap: {
      control: 'select',
      options: ['overlap', 'no-overlap'],
    },
  },
  args: {
    value: 3,
    max: 99,
    variant: 'standard',
    color: 'red',
    overlap: 'overlap',
    anchorOrigin: { vertical: 'top', horizontal: 'right' },
  },
  render: (args) => (
    <Badge {...args}>
      <Anchor />
    </Badge>
  ),
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Dot: Story = {
  args: { variant: 'dot' },
};

export const Square: Story = {
  args: { variant: 'square', value: 12 },
};

export const OverMax: Story = {
  args: { value: 120, max: 99 },
};

export const ShowZero: Story = {
  args: { value: 0, showZero: true },
};

export const Hidden: Story = {
  args: { hidden: true, value: 5 },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      {(['grey', 'red', 'green', 'blue', 'yellow', 'purple'] as const).map((c) => (
        <Badge key={c} value={5} color={c}>
          <Anchor label={c} />
        </Badge>
      ))}
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <Badge variant="dot" color="red">
        <Anchor label="dot" />
      </Badge>
      <Badge variant="standard" value={8} color="red">
        <Anchor label="std" />
      </Badge>
      <Badge variant="square" value={42} color="blue">
        <Anchor label="sq" />
      </Badge>
    </div>
  ),
};
