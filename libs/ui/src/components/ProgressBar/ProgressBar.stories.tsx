import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
    variant: {
      control: 'select',
      options: ['default', 'password-strength', 'performance', 'stacked'],
    },
    showLabel: { control: 'boolean' },
    label: { control: 'text' },
    strengthScore: {
      control: 'select',
      options: [0, 1, 2, 3, 4],
    },
    trackColorClass: { control: 'text' },
    fillColorClass: { control: 'text' },
    showLegend: { control: 'boolean' },
  },
  args: {
    value: 60,
    max: 100,
    variant: 'default',
    showLabel: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: { showLabel: true, label: '업로드 중...', value: 40 },
};

export const NoLabel: Story = {
  args: { showLabel: false, value: 75 },
};

export const Performance: Story = {
  args: { variant: 'performance', value: 82, showLabel: true, label: '성과 82점' },
};

export const PasswordStrengthWeak: Story = {
  args: { variant: 'password-strength', strengthScore: 0, showLabel: true },
};

export const PasswordStrengthMedium: Story = {
  args: { variant: 'password-strength', strengthScore: 2, showLabel: true },
};

export const PasswordStrengthStrong: Story = {
  args: { variant: 'password-strength', strengthScore: 4, showLabel: true },
};

export const Stacked: Story = {
  args: {
    variant: 'stacked',
    showLegend: true,
    segments: [
      { value: 40, label: '완료', showLabel: true },
      { value: 25, label: '진행중', showLabel: true },
      { value: 15, label: '대기', showLabel: true },
      { value: 20, label: '실패', showLabel: true },
    ],
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <ProgressBar variant="default" value={45} showLabel />
      <ProgressBar variant="performance" value={72} showLabel label="성과 72" />
      <ProgressBar variant="password-strength" strengthScore={3} showLabel />
      <ProgressBar
        variant="stacked"
        showLegend
        segments={[
          { value: 50, label: 'A' },
          { value: 30, label: 'B' },
          { value: 20, label: 'C' },
        ]}
      />
    </div>
  ),
};
