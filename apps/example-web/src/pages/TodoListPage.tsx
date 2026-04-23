import {
  Button,
  Checkbox,
  Chip,
  ListSkeleton,
  RadioGroup,
  Table,
} from "@monorepo/ui";
import type { TableColumn } from "@monorepo/ui";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDeleteTodoMutation,
  useTodosQuery,
  useToggleTodoMutation,
} from "../queries/todos";
import type { Todo, TodoStatus } from "../services/todos";

/**
 * TodoListPage — `docs/screens/todo-list.md`.
 *
 * 레이아웃 (시안 Variant A 표 + 세그먼트):
 *   - 페이지 헤더: 제목 "할 일" + Primary "+ 새 할 일".
 *   - 상태 필터: `RadioGroup` (세그먼트 스타일 default variant) 3옵션.
 *   - 본문 표: 컬럼 5개 (체크박스 / 제목 / 마감일 / 상태 / 액션).
 *
 * 헤더 + 필터는 Loading/Error/Empty 에서 유지 (`global-states.md §2`).
 * 본문(`renderBody()`) 만 상태별 치환.
 *
 * 데이터:
 *   - GET /todos?status=...   : useTodosQuery.
 *   - PATCH /todos/{id}/toggle : useToggleTodoMutation (낙관적 업데이트).
 *   - DELETE /todos/{id}       : useDeleteTodoMutation.
 *   - 생성 / 편집 은 별도 폼 페이지 (`/todos/new`, `/todos/:id/edit`).
 *
 * 에러 문구는 한국어 고정. 서버 원문/스택 노출 금지 (`global-states.md §3.2`).
 */

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행 중" },
  { value: "completed", label: "완료" },
];

/**
 * overdue 판정.
 * PRD: `(dueDate < 오늘) && completed === false` 인 경우 화면 쪽에서 overdue 로 표시.
 * 시간 성분은 제거 (오늘 00:00:00 기준).
 */
function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function TodoListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TodoStatus>("all");

  const todosQuery = useTodosQuery(status);
  const toggleMutation = useToggleTodoMutation();
  const deleteMutation = useDeleteTodoMutation();

  const handleToggle = useCallback(
    (id: number) => {
      toggleMutation.mutate(id);
    },
    [toggleMutation],
  );

  const handleDelete = useCallback(
    (id: number) => {
      // 네이티브 confirm — 화면정의서 인터랙션 8 에 허용됨.
      if (!window.confirm("할 일을 삭제하시겠습니까?")) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/todos/${id}/edit`);
    },
    [navigate],
  );

  const handleStatusChange = useCallback((next: unknown) => {
    setStatus(next as TodoStatus);
  }, []);

  const columns: TableColumn<Todo>[] = [
    {
      key: "completed",
      header: "",
      width: "48px",
      align: "center",
      render: (row) => (
        <Checkbox
          checked={row.completed}
          onChange={() => handleToggle(row.id)}
        />
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <span
          className={
            row.completed
              ? "text-muted line-through decoration-2"
              : undefined
          }
        >
          {row.title}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "마감일",
      width: "160px",
      render: (row) => {
        if (!row.dueDate) {
          return <span className="text-muted italic">기한 없음</span>;
        }
        const overdue = isOverdue(row.dueDate, row.completed);
        return (
          <span
            className={
              overdue
                ? "text-red-red900 font-semibold tabular-nums"
                : row.completed
                  ? "text-muted tabular-nums"
                  : "tabular-nums"
            }
          >
            {row.dueDate}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "상태",
      width: "112px",
      render: (row) => {
        if (row.completed) {
          return <Chip label="완료" variant="green" size="sm" rounded="rounded-full" fontWeight="font-semibold" />;
        }
        if (isOverdue(row.dueDate, row.completed)) {
          return <Chip label="기한 지남" variant="red" size="sm" rounded="rounded-full" fontWeight="font-semibold" />;
        }
        return <Chip label="진행 중" variant="yellow" size="sm" rounded="rounded-full" fontWeight="font-semibold" />;
      },
    },
    {
      key: "actions",
      header: "액션",
      width: "180px",
      align: "right",
      render: (row) => (
        <span className="inline-flex gap-1 justify-end">
          <Button
            variant="outlined"
            size="sm"
            label="편집"
            onClick={() => handleEdit(row.id)}
          />
          <Button
            variant="outlined"
            color="red"
            size="sm"
            label="삭제"
            onClick={() => handleDelete(row.id)}
            disabled={deleteMutation.isPending}
          />
        </span>
      ),
    },
  ];

  const renderBody = () => {
    if (todosQuery.isLoading) {
      return (
        <ListSkeleton
          items={5}
          variant="bordered"
          showAvatar={false}
          showSubtitle={false}
          showAction
        />
      );
    }

    if (todosQuery.isError) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-red-red900">목록을 불러오지 못했습니다.</p>
          <Button
            variant="outlined"
            size="sm"
            label="다시 시도"
            onClick={() => {
              void todosQuery.refetch();
            }}
          />
        </div>
      );
    }

    // 빈 상태는 Table 의 emptyMessage 에 위임 (data-display.md §5.1).
    return (
      <Table<Todo>
        columns={columns}
        rows={todosQuery.data ?? []}
        getRowKey={(row) => row.id}
        emptyMessage="표시할 할 일이 없습니다."
      />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">할 일</h1>
        <Button
          variant="contained"
          color="primary"
          label="+ 새 할 일"
          onClick={() => navigate("/todos/new")}
        />
      </header>

      <div>
        <RadioGroup
          value={status}
          options={STATUS_OPTIONS}
          onChange={handleStatusChange}
        />
      </div>

      {renderBody()}
    </div>
  );
}

export default TodoListPage;
