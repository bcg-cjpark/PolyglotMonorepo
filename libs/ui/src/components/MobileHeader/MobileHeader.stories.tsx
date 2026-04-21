import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '#/components/IconButton';
import { MobileHeader } from './MobileHeader';

const meta: Meta<typeof MobileHeader> = {
  title: 'Components/MobileHeader',
  component: MobileHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    rightIcon: { control: 'text' },
    showRightIcon: { control: 'boolean' },
    showNotificationBadge: { control: 'boolean' },
    // ReactNode 슬롯은 controls 에서 제외.
    renderLeft: { control: false },
    renderCenter: { control: false },
    onRightIconClick: { action: 'rightIconClicked' },
  },
  args: {
    title: '홈',
    showRightIcon: true,
    rightIcon: 'notification',
    showNotificationBadge: false,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 360,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MobileHeader>;

export const Default: Story = {};

export const WithNotificationBadge: Story = {
  args: { showNotificationBadge: true },
};

export const SettingsIcon: Story = {
  args: { title: '설정', rightIcon: 'settings' },
};

export const NoRightIcon: Story = {
  args: { title: '알림', showRightIcon: false },
};

export const CustomLeftSlot: Story = {
  args: {
    title: '프로필',
    renderLeft: (
      <IconButton
        icon={{ name: 'arrow-backward', size: 'md' }}
        shape="square"
        padding="0px"
        size="md"
      />
    ),
  },
};

export const CustomCenter: Story = {
  args: {
    renderCenter: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>브랜드</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>v1.0</span>
      </div>
    ),
  },
};
