import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['dot', 'label'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    current: { control: { type: 'number', min: 0, max: 10, step: 1 } },
    count: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    stepLabels: { control: 'object' },
  },
  args: {
    variant: 'dot',
    current: 0,
    size: 'md',
    count: 3,
    stepLabels: ['기본정보', '인증', '완료'],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 640, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const DotDefault: Story = {
  args: { variant: 'dot', current: 0, count: 3 },
};

export const DotMiddle: Story = {
  args: { variant: 'dot', current: 2, count: 5 },
};

export const DotLast: Story = {
  args: { variant: 'dot', current: 4, count: 5 },
};

export const LabelThreeSteps: Story = {
  args: {
    variant: 'label',
    current: 0,
    stepLabels: ['기본정보', '인증', '완료'],
  },
};

export const LabelInProgress: Story = {
  args: {
    variant: 'label',
    current: 1,
    stepLabels: ['기본정보', '인증', '완료'],
  },
};

export const LabelAllDone: Story = {
  args: {
    variant: 'label',
    current: 2,
    stepLabels: ['기본정보', '인증', '완료'],
  },
};

export const LabelFiveSteps: Story = {
  args: {
    variant: 'label',
    current: 2,
    stepLabels: ['약관', '본인확인', '계정', '결제', '완료'],
  },
};

export const LabelSmall: Story = {
  args: {
    variant: 'label',
    size: 'sm',
    current: 1,
    stepLabels: ['입력', '검토', '제출'],
  },
};
