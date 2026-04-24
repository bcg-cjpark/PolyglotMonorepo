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

/** variant=alert — info. 정보성 안내. */
export const AlertInfo: Story = {
  args: {
    title: '안내',
    variant: 'alert',
    alertVariant: 'info',
    description: '이 작업은 5분 정도 소요됩니다. 잠시만 기다려 주세요.',
    showCancelButton: false,
    confirmText: '확인',
  },
};

/** variant=alert — warning. 주의 환기. */
export const AlertWarning: Story = {
  args: {
    title: '주의',
    variant: 'alert',
    alertVariant: 'warning',
    description: '이 변경은 되돌릴 수 없습니다. 계속하시겠습니까?',
    confirmText: '계속',
    cancelText: '취소',
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

/**
 * async onConfirm 대기 시나리오 — `onConfirm` 이 1.5초 delay 후 resolve 하는 Promise
 * 를 반환합니다. Modal 은 Promise 가 resolve 될 때까지 대기했다가 자동으로 close 합니다.
 * 사용자가 "확인" 을 누르면 버튼 로딩/대기 동안 모달이 유지되다가 resolve 후 닫힙니다.
 */
export const AsyncConfirm: Story = {
  args: {
    title: '비동기 저장',
    description: '확인을 누르면 1.5초 후 resolve 되는 Promise 를 기다립니다.',
    confirmText: '저장',
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <Modal
        {...args}
        isOpen={open}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 1500));
          // Modal 이 await 후 자동으로 onClose 호출 → 여기선 setOpen 만 반영
        }}
      >
        <p style={{ margin: 0, color: '#374151' }}>
          1.5초 지연 후 resolve 하는 async onConfirm. Modal 이 대기한 뒤 닫힙니다.
        </p>
      </Modal>
    );
  },
};

/**
 * reject 시 모달 유지 — 에러 메시지 표시 UX. `onConfirm` 이 Promise.reject 하면
 * Modal 은 닫히지 않습니다. 사용자가 에러를 확인한 뒤 재시도하거나 취소할 수 있도록
 * 모달 내부에 에러 메시지를 노출하는 패턴입니다.
 */
export const AsyncConfirmReject: Story = {
  args: {
    title: '저장 실패 시나리오',
    description: '확인을 누르면 0.5초 뒤 reject 되어 모달이 유지됩니다.',
    confirmText: '저장',
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    return (
      <Modal
        {...args}
        isOpen={open}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setErr(null);
          await new Promise((r) => setTimeout(r, 500));
          setErr('저장 실패');
          throw new Error('mock failure');
        }}
      >
        <p style={{ margin: 0, color: '#374151' }}>
          onConfirm 이 reject → 모달은 유지됩니다.
        </p>
        {err && (
          <p style={{ color: 'var(--font-color-danger, red)', marginTop: 8 }}>{err}</p>
        )}
      </Modal>
    );
  },
};

/**
 * 동기 throw 양보 — `onCancel` 이 동기적으로 throw 하면 Modal 은 닫히지 않고
 * 유지됩니다. 외부가 "취소" 를 다른 모드(예: 미저장 변경사항 확인 모달) 로
 * 전환하는 양보 경로(yield) 패턴을 시각화합니다.
 *
 * dogfooding: memo-dialog §2.c 의 "취소 양보 경로" 를 위한 패턴.
 */
export const CancelYieldSync: Story = {
  args: {
    title: '확인',
    cancelText: '취소',
    confirmText: '확인',
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    const [yielded, setYielded] = useState(false);
    return (
      <Modal
        {...args}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        onCancel={() => {
          setYielded(true);
          throw new Error('yield'); // close 보류
        }}
      >
        <p style={{ margin: 0, color: '#374151' }}>
          "취소" 를 누르면 throw 되어 모달이 유지됩니다.
        </p>
        {yielded && (
          <p style={{ color: 'var(--font-color-default-muted)', marginTop: 8 }}>
            양보 처리됨 — 모달이 그대로 유지됨
          </p>
        )}
      </Modal>
    );
  },
};

/**
 * async reject 양보 — `onCancel` 이 비동기적으로 reject 하면 Modal 은
 * Promise 가 settle 될 때까지 대기한 뒤에도 닫히지 않고 유지됩니다.
 * 외부가 네트워크/상태 확인 후 "취소" 를 양보시켜야 하는 경우의 패턴입니다.
 *
 * dogfooding: memo-dialog §2.c 의 "취소 양보 경로" 를 위한 패턴.
 */
export const CancelYieldAsync: Story = {
  args: {
    title: '확인',
    cancelText: '취소',
    confirmText: '확인',
  },
  render: (args) => {
    const [open, setOpen] = useState(true);
    const [yielded, setYielded] = useState(false);
    return (
      <Modal
        {...args}
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        onCancel={async () => {
          setYielded(false);
          await new Promise((r) => setTimeout(r, 300));
          setYielded(true);
          throw new Error('yield'); // close 보류
        }}
      >
        <p style={{ margin: 0, color: '#374151' }}>
          "취소" 를 누르면 0.3초 뒤 async reject 되어 모달이 유지됩니다.
        </p>
        {yielded && (
          <p style={{ color: 'var(--font-color-default-muted)', marginTop: 8 }}>
            양보 처리됨 — 모달이 그대로 유지됨
          </p>
        )}
      </Modal>
    );
  },
};
