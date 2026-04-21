import type { Meta, StoryObj } from '@storybook/react-vite';
import { List } from './List';
import { ListItem } from './ListItem';
import { ListItemAvatar } from './ListItemAvatar';
import { ListItemText } from './ListItemText';
import { MobileList } from './MobileList';
import { MobileListItem } from './MobileListItem';

/**
 * `List` 는 `ListItem` / `ListItemAvatar` / `ListItemText` 와 함께 쓰이는 compound 컴포넌트입니다.
 * Mobile 변형은 `MobileList` + `MobileListItem` 을 사용하며 스와이프 제스처를 지원합니다.
 *
 * 여기서는 대표적인 합성 시나리오를 Named Story 로 묶어 제공합니다.
 */
const meta: Meta<typeof List> = {
  title: 'Components/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    subheader: { control: 'text' },
    gap: { control: 'text' },
    // children 은 render 에서 직접 주입.
    children: { control: false },
  },
  args: {
    subheader: '',
    gap: '0px',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: 420,
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
type Story = StoryObj<typeof List>;

/** 단순 단일 줄 리스트. */
export const Default: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem divider>
        <ListItemText primary="첫 번째 항목" />
      </ListItem>
      <ListItem divider>
        <ListItemText primary="두 번째 항목" />
      </ListItem>
      <ListItem>
        <ListItemText primary="세 번째 항목" />
      </ListItem>
    </List>
  ),
};

/** 서브헤더 + 아바타 + 2줄 텍스트 조합. */
export const WithAvatar: Story = {
  args: { subheader: '최근 활동' },
  render: (args) => (
    <List {...args}>
      <ListItem divider>
        <ListItemAvatar fallback="김" color="primary" />
        <ListItemText primary="김민수" secondary="메시지를 보냈습니다" />
      </ListItem>
      <ListItem divider>
        <ListItemAvatar fallback="이" color="blue" />
        <ListItemText primary="이서연" secondary="방금 로그인함" />
      </ListItem>
      <ListItem>
        <ListItemAvatar fallback="박" color="green" />
        <ListItemText primary="박지호" secondary="프로필을 업데이트했습니다" />
      </ListItem>
    </List>
  ),
};

/** 2줄 텍스트 + 우측 primary/secondary. */
export const TwoLine: Story = {
  args: { subheader: '거래 내역' },
  render: (args) => (
    <List {...args}>
      <ListItem divider>
        <ListItemText
          primary="스타벅스 강남점"
          secondary="2026-04-20"
          rightPrimary="-5,800원"
          rightSecondary="체크카드"
        />
      </ListItem>
      <ListItem divider>
        <ListItemText
          primary="교통카드 충전"
          secondary="2026-04-19"
          rightPrimary="-20,000원"
          rightSecondary="체크카드"
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary="급여 입금"
          secondary="2026-04-15"
          rightPrimary="+3,200,000원"
          rightSecondary="계좌이체"
        />
      </ListItem>
    </List>
  ),
};

/** 클릭 가능 + secondary action 아이콘. */
export const ClickableItems: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem clickable divider secondaryAction={{ name: 'arrow-forward' }}>
        <ListItemText primary="계정 설정" />
      </ListItem>
      <ListItem clickable divider secondaryAction={{ name: 'arrow-forward' }}>
        <ListItemText primary="알림 설정" />
      </ListItem>
      <ListItem clickable divider secondaryAction={{ name: 'arrow-forward' }} selected>
        <ListItemText primary="보안" />
      </ListItem>
      <ListItem clickable disabled secondaryAction={{ name: 'arrow-forward' }}>
        <ListItemText primary="비활성 항목" />
      </ListItem>
    </List>
  ),
};

/** MobileList + MobileListItem (스와이프 지원) 조합. */
export const MobileVariant: Story = {
  render: () => (
    <MobileList subheader="모바일 리스트" swipeAction>
      <MobileListItem clickable divider>
        <ListItemAvatar fallback="알" color="red" />
        <ListItemText
          primary="시스템 알림"
          secondary="새로운 메시지가 도착했습니다"
          rightSecondary="방금"
        />
      </MobileListItem>
      <MobileListItem clickable divider>
        <ListItemAvatar fallback="공" color="blue" />
        <ListItemText
          primary="공지사항"
          secondary="정기점검 안내"
          rightSecondary="1시간 전"
        />
      </MobileListItem>
      <MobileListItem clickable>
        <ListItemAvatar fallback="이" color="green" />
        <ListItemText
          primary="이벤트"
          secondary="4월 프로모션 진행 중"
          rightSecondary="어제"
        />
      </MobileListItem>
    </MobileList>
  ),
};

/** 아바타 크기/모양 바리에이션. */
export const AvatarVariants: Story = {
  render: () => (
    <List>
      <ListItem divider>
        <ListItemAvatar size="sm" variant="circular" fallback="S" color="primary" />
        <ListItemText primary="Small · Circular" />
      </ListItem>
      <ListItem divider>
        <ListItemAvatar size="md" variant="rounded" fallback="M" color="blue" />
        <ListItemText primary="Medium · Rounded" />
      </ListItem>
      <ListItem divider>
        <ListItemAvatar size="lg" variant="square" fallback="L" color="purple" />
        <ListItemText primary="Large · Square" />
      </ListItem>
      <ListItem>
        <ListItemAvatar
          size="md"
          variant="circular"
          icon={{ name: 'person' }}
          color="green"
        />
        <ListItemText primary="아이콘 아바타" />
      </ListItem>
    </List>
  ),
};

/** 간격(gap) 옵션 시연. */
export const WithGap: Story = {
  args: { subheader: '간격 있는 카드형 리스트', gap: '8px' },
  render: (args) => (
    <List {...args}>
      <ListItem>
        <ListItemText primary="카드 A" secondary="여백이 들어간 아이템" />
      </ListItem>
      <ListItem>
        <ListItemText primary="카드 B" secondary="여백이 들어간 아이템" />
      </ListItem>
      <ListItem>
        <ListItemText primary="카드 C" secondary="여백이 들어간 아이템" />
      </ListItem>
    </List>
  ),
};
