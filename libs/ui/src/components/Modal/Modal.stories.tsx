import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import type { ModalAction } from './ModalFooter';
import { Button } from '#/components/Button';

/**
 * `Modal` 은 `ModalHeader` / `ModalContent` / `ModalFooter` 서브컴포넌트와
 * 함께 동작하는 compound 컴포넌트입니다. 기본적으로 `Modal` 이 내부적으로
 * 이 세 블록을 조합해 렌더링하며, `renderTitle` / `renderActions` /
 * `renderFooter` 슬롯으로 커스터마이즈할 수 있습니다.
 *
 * 대표 시나리오를 Named Story 로 제공합니다. 서브컴포넌트 argTypes 는
 * meta 에 노출하지 않고 각 스토리의 args 로 전달합니다.
 */
const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'confirm', 'alert'],
    },
    alertVariant: {
      control: 'select',
      options: [undefined, 'success', 'info', 'warning', 'error'],
    },
    contentPadding: {
      control: 'select',
      options: ['default', 'compact', 'none'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
    cancelText: { control: 'text' },
    confirmText: { control: 'text' },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    showBackButton: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    showDefaultFooter: { control: 'boolean' },
    showCancelButton: { control: 'boolean' },
    showConfirmButton: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    isOpen: { control: false },
    actions: { control: false },
    children: { control: false },
    renderTitle: { control: false },
    renderActions: { control: false },
    renderFooter: { control: false },
    onClose: { action: 'closed' },
    onBack: { action: 'backed' },
    onCancel: { action: 'canceled' },
    onConfirm: { action: 'confirmed' },
    onAction: { action: 'action' },
  },
  args: {
    size: 'md',
    variant: 'default',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    showBackButton: false,
    showDefaultFooter: true,
    showCancelButton: true,
    showConfirmButton: true,
    fullWidth: true,
    contentPadding: 'default',
    cancelText: '취소',
    confirmText: '확인',
  },
  decorators: [
    (Story, ctx) => {
      const [isOpen, setIsOpen] = useState<boolean>(!!ctx.args.isOpen);
      return (
        <div style={{ padding: 24 }}>
          <Button
            label="모달 열기"
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
              onCancel: () => {
                ctx.args.onCancel?.();
              },
              onConfirm: () => {
                ctx.args.onConfirm?.();
              },
            }}
          />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof Modal>;

/** 기본 모달 — 제목 + 설명 + 기본 푸터(확인/취소). */
export const Default: Story = {
  args: {
    title: '기본 모달',
    description: '가장 일반적인 모달 형태입니다. 오버레이 / ESC 로 닫을 수 있습니다.',
    children: (
      <p style={{ margin: 0, color: '#374151' }}>
        여기에 모달 본문이 들어갑니다. 긴 설명이나 폼을 자유롭게 배치할 수 있습니다.
      </p>
    ),
  },
};

/** 뒤로가기 버튼을 헤더 좌측에 노출. */
export const WithBackButton: Story = {
  args: {
    title: '상세 설정',
    showBackButton: true,
    children: (
      <p style={{ margin: 0, color: '#374151' }}>
        헤더 좌측 뒤로가기 버튼과 우측 닫기 버튼이 함께 표시됩니다.
      </p>
    ),
  },
};

/** 헤더 우측에 커스텀 액션 주입. */
export const WithHeaderActions: Story = {
  args: {
    title: '옵션',
    renderActions: (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          style={{
            padding: '4px 8px',
            fontSize: 12,
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          편집
        </button>
        <button
          type="button"
          style={{
            padding: '4px 8px',
            fontSize: 12,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#991b1b',
            cursor: 'pointer',
          }}
        >
          삭제
        </button>
      </div>
    ),
    children: <p style={{ margin: 0 }}>헤더 우측 renderActions 슬롯으로 버튼을 주입했습니다.</p>,
  },
};

/** 스크롤 되는 긴 본문. */
export const LongContent: Story = {
  args: {
    title: '이용약관',
    children: (
      <div style={{ color: '#374151', lineHeight: 1.6 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>
            {i + 1}. 본 이용약관은 샘플 텍스트입니다. 실제 서비스에서는 법무 검토를 거친 문구가 들어갑니다.
            사용자는 본 약관에 동의함으로써 서비스 이용 권한을 얻게 됩니다.
          </p>
        ))}
      </div>
    ),
  },
};

/** 오버레이 클릭으로 닫히지 않음 — 중요 확인 모달에 사용. */
export const DimClickDisabled: Story = {
  args: {
    title: '저장되지 않은 변경사항',
    description: '오버레이를 눌러도 닫히지 않습니다. 반드시 버튼으로 선택하세요.',
    closeOnOverlayClick: false,
    confirmText: '저장',
    cancelText: '버리기',
  },
};

/** variant=alert — 알림 아이콘 포함 (success). */
export const AlertSuccess: Story = {
  args: {
    title: '저장되었습니다',
    variant: 'alert',
    alertVariant: 'success',
    description: '변경사항이 정상적으로 저장되었습니다.',
    showCancelButton: false,
    confirmText: '확인',
  },
};

/** variant=alert — error. */
export const AlertError: Story = {
  args: {
    title: '오류가 발생했습니다',
    variant: 'alert',
    alertVariant: 'error',
    description: '요청을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.',
    showCancelButton: false,
    confirmText: '닫기',
  },
};

/** 푸터 없음 — 순수 정보 표시. */
export const NoFooter: Story = {
  args: {
    title: '정보',
    showDefaultFooter: false,
    children: (
      <p style={{ margin: 0, color: '#374151' }}>
        푸터가 없는 경량 모달입니다. 헤더 닫기 버튼 또는 ESC 로만 닫을 수 있습니다.
      </p>
    ),
  },
};

/** 커스텀 액션 버튼 배열. */
export const CustomActions: Story = {
  args: {
    title: '파일 작업',
    showDefaultFooter: false,
    actions: [
      { label: '다운로드', variant: 'contained' },
      { label: '공유', variant: 'outlined' },
      { label: '삭제', variant: 'outlined', disabled: true },
    ] as ModalAction[],
    children: <p style={{ margin: 0 }}>액션 배열로 푸터 버튼을 동적으로 구성할 수 있습니다.</p>,
  },
};
