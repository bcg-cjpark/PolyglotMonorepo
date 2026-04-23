import { memo, useCallback } from "react";
import type { Memo } from "../services/memos";

/**
 * MemoCard — MemoListPage 전용 합성 카드.
 *
 * 역할: 메모 1건을 리스트 행 (카드) 형태로 표현. 제목(ellipsis) + 본문 스니펫
 *       (2~3줄 clamp, plain text) + 작성/수정 메타.
 *
 * 합성 위치: `apps/example-web/src/components/` — 페이지 전용 합성이므로 `libs/ui`
 *          에 두지 않는다 (CLAUDE.md "UI 라이브러리 우선 규칙" / data-display.md §5.2).
 *
 * 렌더 규칙 (PRD memo.md):
 *   - 본문은 plain text 만. 마크다운/HTML 렌더 금지 (XSS 방지 + 스펙 요구).
 *   - 줄바꿈은 `whitespace-pre-wrap` 로 유지 + `line-clamp-3` 로 말줄임.
 *
 * 접근성:
 *   - 전체 카드를 `<button type="button">` 으로 감싸 키보드 Enter/Space 로
 *     `onClick` 이 발화 (네이티브 button 기본 동작). Tab focus 순서에 포함.
 *
 * 시각 값:
 *   - 색/간격/radius 는 `libs/tokens` + Tailwind 토큰 유틸 경유. 하드코딩 금지.
 *   - 시안: docs/design-notes/memo-variants/memo-list-a.html `.memo-card`.
 */

export interface MemoCardProps {
  memo: Memo;
  onClick: (memo: Memo) => void;
}

function formatMetaDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ko-KR");
}

function MemoCardImpl({ memo, onClick }: MemoCardProps) {
  const handleClick = useCallback(() => {
    onClick(memo);
  }, [memo, onClick]);

  const content = memo.content ?? "";
  const hasContent = content.length > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`메모 열기: ${memo.title}`}
      className="flex w-full flex-col gap-2 rounded-md border border-solid border-border bg-bg-bg-default px-6 py-4 text-left transition-colors duration-150 hover:bg-[var(--background-bg-innerframe)] hover:border-default-muted focus:outline-none focus-visible:border-input-border-focus focus-visible:shadow-[0_0_0_3px_var(--base-colors-primary-primary100)]"
    >
      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold tracking-tight text-default">
        {memo.title}
      </span>
      {hasContent ? (
        <span className="block whitespace-pre-wrap text-sm leading-relaxed text-default line-clamp-3">
          {content}
        </span>
      ) : (
        <span className="block text-sm italic text-muted">(본문 없음)</span>
      )}
      <span className="flex items-center gap-2 text-xs text-muted">
        <span>작성 {formatMetaDate(memo.createdAt)}</span>
        <span aria-hidden="true" className="text-neutral-neutral300">
          ·
        </span>
        <span>수정 {formatMetaDate(memo.updatedAt)}</span>
      </span>
    </button>
  );
}

export const MemoCard = memo(MemoCardImpl);
