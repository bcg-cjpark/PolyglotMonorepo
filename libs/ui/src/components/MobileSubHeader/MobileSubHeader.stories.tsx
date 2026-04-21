import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '#/components/IconButton';
import { MobileSubHeader } from './MobileSubHeader';

const meta: Meta<typeof MobileSubHeader> = {
  title: 'Components/MobileSubHeader',
  component: MobileSubHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    backIcon: { control: 'text' },
    titleAlign: {
      control: 'select',
      options: ['left', 'center'],
    },
    allowTitleInteraction: { control: 'boolean' },
    backButtonVisible: { control: 'boolean' },
    renderTitle: { control: false },
    renderRight: { control: false },
    onBack: { action: 'back' },
  },
  args: {
    title: '상세 페이지',
    backIcon: 'arrow-backward',
    titleAlign: 'left',
    allowTitleInteraction: false,
    backButtonVisible: true,
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
type Story = StoryObj<typeof MobileSubHeader>;

export const Default: Story = {};

export const CenterAligned: Story = {
  args: { titleAlign: 'center', title: '중앙 정렬 타이틀' },
};

export const NoBackButton: Story = {
  args: { backButtonVisible: false, title: '뒤로가기 없음' },
};

export const CloseIcon: Story = {
  args: { backIcon: 'close', title: '닫기 버튼' },
};

export const WithRightAction: Story = {
  args: {
    title: '주문 내역',
    renderRight: (
      <IconButton
        icon={{ name: 'search', size: 'md' }}
        shape="square"
        padding="0px"
        size="md"
      />
    ),
  },
};

export const CustomTitle: Story = {
  args: {
    titleAlign: 'center',
    allowTitleInteraction: true,
    renderTitle: (
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        서울 강남구
        <span style={{ fontSize: 12 }}>▼</span>
      </button>
    ),
  },
};
