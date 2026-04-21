import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useCallback } from 'react';
import { ClosableToast } from './ClosableToast';
import type { ToastItem } from './ClosableToast';
import { Button } from '#/components/Button';

/**
 * `ClosableToast` 는 `toasts` 배열을 받아 여러 토스트를 스택으로 렌더링하는
 * 프레젠테이셔널 컴포넌트입니다. Provider / Hook 은 제공되지 않으며, 부모에서
 * 토스트 목록 / 제거 핸들러를 직접 관리하면 됩니다.
 *
 * 여기서는 `useState` 데코레이터로 토스트 추가 / 제거를 시뮬레이션합니다.
 */
const INITIAL_TOASTS: ToastItem[] = [
  {
    id: 'toast-1',
    variant: 'info',
    title: '알림',
    message: '새로운 메시지가 도착했습니다.',
    timestamp: Date.now(),
  },
  {
    id: 'toast-2',
    variant: 'warning',
    title: '경고',
    message: '세션이 곧 만료됩니다.',
    timestamp: Date.now(),
  },
];

const meta: Meta<typeof ClosableToast> = {
  title: 'Components/Toast',
  component: ClosableToast,
  tags: ['autodocs'],
  argTypes: {
    width: { control: 'text' },
    showCloseButton: { control: 'boolean' },
    toasts: { control: false },
    onRemove: { action: 'removed' },
  },
  args: {
    width: '400px',
    showCloseButton: true,
    toasts: INITIAL_TOASTS,
  },
  decorators: [
    (Story, ctx) => {
      const [toasts, setToasts] = useState<ToastItem[]>(
        (ctx.args.toasts as ToastItem[]) ?? []
      );
      const handleRemove = useCallback(
        (id: string) => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          ctx.args.onRemove?.(id);
        },
        [ctx.args]
      );
      const handleAdd = () => {
        const id = `toast-${Date.now()}`;
        setToasts((prev) => [
          ...prev,
          {
            id,
            variant: 'info',
            title: '새 알림',
            message: `토스트 ${prev.length + 1} 번이 추가되었습니다.`,
            timestamp: Date.now(),
          },
        ]);
      };
      return (
        <div style={{ padding: 24, minHeight: 240 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <Button label="토스트 추가" variant="contained" onClick={handleAdd} />
            <Button
              label="전체 제거"
              variant="outlined"
              onClick={() => setToasts([])}
            />
          </div>
          <Story args={{ ...ctx.args, toasts, onRemove: handleRemove }} />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ClosableToast>;

/** 기본 — info + warning 스택. */
export const Default: Story = {};

/** 단일 토스트. */
export const Single: Story = {
  args: {
    toasts: [
      {
        id: 't-single',
        variant: 'info',
        title: '저장 완료',
        message: '변경사항이 저장되었습니다.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** info 계열 — 기본 / 보라 / 파랑. */
export const InfoVariants: Story = {
  args: {
    toasts: [
      {
        id: 't-info',
        variant: 'info',
        title: 'info',
        message: '기본 info 변형입니다.',
        timestamp: Date.now(),
      },
      {
        id: 't-info-purple',
        variant: 'info-purple',
        title: 'info-purple',
        message: '보라 info 변형입니다.',
        timestamp: Date.now(),
      },
      {
        id: 't-info-blue',
        variant: 'info-blue',
        title: 'info-blue',
        message: '파랑 info 변형입니다.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** 경고. */
export const Warning: Story = {
  args: {
    toasts: [
      {
        id: 't-warn',
        variant: 'warning',
        title: '주의',
        message: '입력값을 다시 확인해주세요.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** 에러. */
export const Error: Story = {
  args: {
    toasts: [
      {
        id: 't-err',
        variant: 'error',
        title: '실패',
        message: '요청을 처리하지 못했습니다.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** 아이콘 포함. */
export const WithIcons: Story = {
  args: {
    toasts: [
      {
        id: 't-icon-1',
        variant: 'info',
        icon: 'check-circle',
        title: '완료',
        message: '작업이 성공적으로 완료되었습니다.',
        timestamp: Date.now(),
      },
      {
        id: 't-icon-2',
        variant: 'warning',
        icon: 'star',
        title: '새로운 기능',
        message: '업데이트된 기능을 확인해보세요.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** 닫기 버튼 숨김. */
export const NoCloseButton: Story = {
  args: {
    showCloseButton: false,
    toasts: [
      {
        id: 't-auto',
        variant: 'info',
        title: '자동 사라짐',
        message: '닫기 버튼이 없습니다. 부모가 타이머로 제거해야 합니다.',
        timestamp: Date.now(),
      },
    ],
  },
};

/** 긴 메시지 — truncate 동작 확인. */
export const LongMessage: Story = {
  args: {
    toasts: [
      {
        id: 't-long',
        variant: 'info-blue',
        title: '긴 메시지',
        message:
          '매우 긴 메시지입니다. 레이아웃이 넘치지 않도록 truncate 스타일이 적용되어 줄임표로 잘립니다. 전체 내용은 title 속성으로 확인할 수 있습니다.',
        timestamp: Date.now(),
      },
    ],
  },
};
