import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['light', 'filled', 'outlined'],
    },
    severity: {
      control: 'select',
      options: [undefined, 'success', 'info', 'warning', 'error'],
    },
    color: {
      control: 'select',
      options: [undefined, 'green', 'blue', 'yellow', 'red', 'primary'],
    },
    textOverflow: {
      control: 'select',
      options: ['none', 'ellipsis', 'clip', 'slide'],
    },
    closable: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    center: { control: 'boolean' },
    rotate: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    autoClose: { control: 'number' },
    onOpen: { action: 'opened' },
    onClose: { action: 'closed' },
  },
  args: {
    variant: 'light',
    severity: 'info',
    closable: true,
    showIcon: true,
    description: '작업이 정상적으로 처리되었습니다.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {};

export const WithTitle: Story = {
  args: {
    title: '제목이 있는 알림',
    description: '본문 설명이 여러 줄에 걸쳐 노출됩니다.',
  },
};

export const Success: Story = {
  args: { severity: 'success', description: '성공적으로 저장되었습니다.' },
};

export const Warning: Story = {
  args: { severity: 'warning', description: '주의가 필요한 항목이 있습니다.' },
};

export const ErrorAlert: Story = {
  args: { severity: 'error', description: '요청을 처리할 수 없습니다.' },
};

export const Filled: Story = {
  args: { variant: 'filled', severity: 'success', description: 'Filled 스타일 알림' },
};

export const Outlined: Story = {
  args: { variant: 'outlined', severity: 'warning', description: 'Outlined 스타일 알림' },
};

export const NotClosable: Story = {
  args: { closable: false, description: '닫기 버튼이 없는 알림' },
};

export const AllSeverities: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Alert {...args} severity="success" description="성공 메시지" />
      <Alert {...args} severity="info" description="정보 메시지" />
      <Alert {...args} severity="warning" description="경고 메시지" />
      <Alert {...args} severity="error" description="오류 메시지" />
    </div>
  ),
};
