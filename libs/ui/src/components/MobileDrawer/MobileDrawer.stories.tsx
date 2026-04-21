import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MobileDrawer } from './MobileDrawer';
import { Button } from '#/components/Button';
import { Icon } from '#/components/Icon';
import type { IconName } from '#/types/icons';

/**
 * `MobileDrawer` 는 화면 좌측에서 슬라이드 인 하는 내비게이션 드로어입니다.
 * 드래그로 좌측으로 쓸어 닫을 수 있고, ESC / 오버레이 클릭으로도 닫을 수 있습니다.
 *
 * 현재 구현은 좌측 고정이며, `width` prop 으로 폭을 조절할 수 있습니다.
 */
const meta: Meta<typeof MobileDrawer> = {
  title: 'Components/MobileDrawer',
  component: MobileDrawer,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text' },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    draggable: { control: 'boolean' },
    isOpen: { control: false },
    children: { control: false },
    container: { control: false },
    onClose: { action: 'closed' },
  },
  args: {
    width: '320px',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    draggable: true,
  },
  decorators: [
    (Story, ctx) => {
      const [isOpen, setIsOpen] = useState<boolean>(!!ctx.args.isOpen);
      return (
        <div style={{ padding: 24 }}>
          <Button
            label="드로어 열기"
            variant="contained"
            onClick={() => setIsOpen(true)}
          />
          <Story
            args={{
              ...ctx.args,
              isOpen,
              onClose: () => {
                setIsOpen(false);
                ctx.args.onClose?.();
              },
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof MobileDrawer>;

const MenuLink = ({ icon, label }: { icon: IconName; label: string }) => (
  <button
    type="button"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '12px 16px',
      background: 'transparent',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      textAlign: 'left',
      color: '#111827',
      fontSize: 14,
    }}
  >
    <Icon name={icon} size="md" />
    {label}
  </button>
);

/** 기본 — 내비게이션 메뉴. */
export const Default: Story = {
  render: (args) => (
    <MobileDrawer {...args}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>메뉴</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MenuLink icon="home" label="홈" />
          <MenuLink icon="list" label="목록" />
          <MenuLink icon="search" label="검색" />
          <MenuLink icon="settings" label="설정" />
          <MenuLink icon="person" label="내 계정" />
        </nav>
      </div>
    </MobileDrawer>
  ),
};

/** 좁은 폭. */
export const NarrowWidth: Story = {
  args: { width: '240px' },
  render: (args) => (
    <MobileDrawer {...args}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>좁은 드로어</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MenuLink icon="home" label="홈" />
          <MenuLink icon="settings" label="설정" />
        </nav>
      </div>
    </MobileDrawer>
  ),
};

/** 넓은 폭. */
export const WideWidth: Story = {
  args: { width: '420px' },
  render: (args) => (
    <MobileDrawer {...args}>
      <div style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 16,
            borderBottom: '1px solid #e5e7eb',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
              fontWeight: 600,
            }}
          >
            김
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>김민수</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>kim@example.com</div>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MenuLink icon="home" label="홈" />
          <MenuLink icon="favorite" label="즐겨찾기" />
          <MenuLink icon="notification" label="알림" />
          <MenuLink icon="settings" label="설정" />
        </nav>
      </div>
    </MobileDrawer>
  ),
};

/** 드래그 비활성. */
export const NonDraggable: Story = {
  args: { draggable: false },
  render: (args) => (
    <MobileDrawer {...args}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>드래그 비활성</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
          좌측으로 쓸어 닫기가 불가능합니다. ESC 나 오버레이로만 닫힙니다.
        </p>
      </div>
    </MobileDrawer>
  ),
};

/** 오버레이 클릭 닫기 비활성. */
export const StickyDrawer: Story = {
  args: { closeOnOverlayClick: false },
  render: (args) => (
    <MobileDrawer {...args}>
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>고정 드로어</h2>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: 13 }}>
          오버레이 클릭으로 닫히지 않습니다. ESC 만 허용.
        </p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <MenuLink icon="home" label="홈" />
          <MenuLink icon="settings" label="설정" />
        </nav>
      </div>
    </MobileDrawer>
  ),
};
