import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from '#/components/Button';

/**
 * `BottomSheet` 은 화면 하단에서 올라오는 모달 표현입니다. 드래그 핸들로
 * 쓸어내려 닫을 수 있고, ESC / 오버레이 클릭으로도 닫을 수 있습니다.
 * 기본 portal 대상은 `document.body` 입니다.
 */
const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    maxHeight: { control: 'text' },
    height: { control: 'text' },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    draggable: { control: 'boolean' },
    isOpen: { control: false },
    children: { control: false },
    renderFooter: { control: false },
    container: { control: false },
    onClose: { action: 'closed' },
  },
  args: {
    closeOnOverlayClick: true,
    closeOnEscape: true,
    draggable: true,
    maxHeight: '90vh',
    title: '',
  },
  decorators: [
    (Story, ctx) => {
      const [isOpen, setIsOpen] = useState<boolean>(!!ctx.args.isOpen);
      return (
        <div style={{ padding: 24 }}>
          <Button
            label="바텀시트 열기"
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
type Story = StoryObj<typeof BottomSheet>;

/** 기본 — 제목 + 본문. */
export const Default: Story = {
  args: {
    title: '옵션 선택',
    children: (
      <div style={{ padding: '8px 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, color: '#374151' }}>
          바텀시트 본문입니다. 드래그 핸들을 쓸어내리거나 오버레이를 탭하면 닫힙니다.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#6b7280' }}>
          <li>항목 A</li>
          <li>항목 B</li>
          <li>항목 C</li>
        </ul>
      </div>
    ),
  },
};

/** 제목 없음 — 미니멀 액션 시트. */
export const NoTitle: Story = {
  args: {
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>
        <Button label="사진 촬영" variant="outlined" fullWidth />
        <Button label="앨범에서 선택" variant="outlined" fullWidth />
        <Button label="파일 업로드" variant="outlined" fullWidth />
      </div>
    ),
  },
};

/** 푸터가 있는 바텀시트 — 고정 버튼 영역. */
export const WithFooter: Story = {
  args: {
    title: '필터',
    children: (
      <div style={{ padding: '8px 0 24px', color: '#374151' }}>
        <p style={{ margin: '0 0 12px' }}>정렬 기준을 선택하세요.</p>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="radio" name="sort" defaultChecked /> 최신순
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="radio" name="sort" /> 인기순
        </label>
        <label style={{ display: 'block' }}>
          <input type="radio" name="sort" /> 가격순
        </label>
      </div>
    ),
    renderFooter: (
      <div style={{ display: 'flex', gap: 8, padding: 16 }}>
        <Button label="초기화" variant="outlined" fullWidth />
        <Button label="적용" variant="contained" fullWidth />
      </div>
    ),
  },
};

/** 고정 높이. */
export const FixedHeight: Story = {
  args: {
    title: '고정 높이',
    height: '50vh',
    children: (
      <div style={{ padding: '8px 0 24px', color: '#374151' }}>
        height 가 50vh 로 고정된 바텀시트입니다. 내용이 적더라도 높이가 유지됩니다.
      </div>
    ),
  },
};

/** 드래그 비활성. */
export const NonDraggable: Story = {
  args: {
    title: '드래그 비활성',
    draggable: false,
    children: (
      <p style={{ margin: 0, padding: '8px 0 24px', color: '#374151' }}>
        핸들이 표시되지 않고, 오버레이 / ESC 로만 닫을 수 있습니다.
      </p>
    ),
  },
};

/** 스크롤되는 긴 본문. */
export const LongContent: Story = {
  args: {
    title: '약관 상세',
    children: (
      <div style={{ padding: '8px 0 24px', color: '#374151', lineHeight: 1.6 }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <p key={i} style={{ margin: '0 0 12px' }}>
            {i + 1}. 스크롤이 필요한 긴 본문 샘플입니다.
          </p>
        ))}
      </div>
    ),
  },
};
