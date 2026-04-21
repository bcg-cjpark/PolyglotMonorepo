import { Memo } from "../services/memos";

interface MemoCardProps {
  memo: Memo;
  onClick: () => void;
}

/**
 * 리스트 페이지 전용 메모 카드 합성.
 * - 제목 + 본문 미리보기(3줄 말줄임) + 생성 시각
 * - 단순 프레젠테이셔널: 상호작용은 부모의 onClick 위임
 */
function MemoCard({ memo, onClick }: MemoCardProps) {
  const formatted = new Date(memo.createdAt).toLocaleString();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border border-neutral-neutral200 rounded-md p-4 hover:border-neutral-neutral400 transition-colors bg-neutral-neutral000"
    >
      <h3 className="text-base font-semibold mb-1 truncate">{memo.title}</h3>
      {memo.content && (
        <p className="text-sm text-neutral-neutral600 mb-2 line-clamp-3 whitespace-pre-wrap">
          {memo.content}
        </p>
      )}
      <p className="text-xs text-neutral-neutral500">{formatted}</p>
    </button>
  );
}

export default MemoCard;
