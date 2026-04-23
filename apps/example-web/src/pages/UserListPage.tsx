import { Button, Input, ListSkeleton, Modal, Table } from "@monorepo/ui";
import type { TableColumn } from "@monorepo/ui";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUsersQuery,
} from "../queries/users";
import type { User } from "../services/users";

/**
 * UserListPage — `docs/screens/user-list.md`.
 *
 * 레이아웃:
 *   - 페이지 헤더 (제목 + "+ 새 사용자") 는 Loading/Error/Empty 모든 상태에서 유지
 *     (`docs/design-notes/global-states.md §2`).
 *   - 본문만 renderBody() 로 상태별 치환.
 *
 * 시안: UserListPage Variant A (표 중심) + UserFormPage Variant C (모달형).
 *
 * 데이터:
 *   - GET /users : useUsersQuery → 표 rows.
 *   - POST /users : useCreateUserMutation (모달 저장).
 *   - DELETE /users/{id} : useDeleteUserMutation (행 삭제).
 *   - 성공 후 `['users']` invalidate → 자동 refetch.
 *
 * 에러 문구는 한국어 고정. 서버 원문/스택 노출 금지 (`global-states.md §3.2`).
 */

// 이메일 형식 간단 검증 — PRD 규칙 `email@domain.tld` 의 기본 보장.
// 서버 측 검증이 최종 권위. 여기서는 즉각 피드백만 제공한다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  name?: string;
}

function formatCreatedAt(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ko-KR");
}

function UserListPage() {
  const usersQuery = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // 모달이 닫힐 때 폼 상태 초기화. 다시 열 때는 빈 값으로 시작.
  useEffect(() => {
    if (!isModalOpen) {
      setFormEmail("");
      setFormName("");
      setFormErrors({});
    }
  }, [isModalOpen]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleDelete = useCallback(
    (id: number) => {
      // 네이티브 confirm — 화면정의서 인터랙션 8 에 허용됨.
      if (!window.confirm("사용자를 삭제하시겠습니까?")) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleConfirm = useCallback(async () => {
    const nextErrors: FormErrors = {};

    // 로컬 검증 — 시안/PRD 메시지 문구 고정.
    if (!EMAIL_PATTERN.test(formEmail)) {
      nextErrors.email = "이메일 형식이 올바르지 않습니다.";
    }
    if (formName.trim().length === 0) {
      nextErrors.name = "이름을 입력하세요.";
    }

    if (nextErrors.email || nextErrors.name) {
      setFormErrors(nextErrors);
      // Modal 의 onConfirm catch 패턴 — throw 하면 모달 유지됨.
      throw new Error("validation");
    }

    try {
      await createMutation.mutateAsync({
        email: formEmail,
        name: formName.trim(),
      });
      setFormErrors({});
      // 성공 — Modal 이 onConfirm resolve 후 자동 close 호출.
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFormErrors({ email: "이미 사용 중인 이메일입니다." });
      } else {
        setFormErrors({ email: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." });
      }
      // Modal 이 닫히지 않도록 re-throw.
      throw err;
    }
  }, [createMutation, formEmail, formName]);

  const columns: TableColumn<User>[] = [
    { key: "name", header: "이름", width: "28%" },
    { key: "email", header: "이메일", width: "36%" },
    {
      key: "createdAt",
      header: "생성일",
      width: "24%",
      render: (row) => (
        <span className="text-muted text-sm">
          {formatCreatedAt(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "액션",
      width: "12%",
      align: "right",
      render: (row) => (
        <Button
          variant="outlined"
          color="red"
          size="sm"
          label="삭제"
          onClick={() => handleDelete(row.id)}
          disabled={deleteMutation.isPending}
        />
      ),
    },
  ];

  const renderBody = () => {
    if (usersQuery.isLoading) {
      // 헤더 유지, 본문만 스켈레톤으로 치환.
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

    if (usersQuery.isError) {
      // 한국어 에러 + 다시 시도. 스택 원문 미노출.
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-red-red900">목록을 불러오지 못했습니다.</p>
          <Button
            variant="outlined"
            size="sm"
            label="다시 시도"
            onClick={() => {
              void usersQuery.refetch();
            }}
          />
        </div>
      );
    }

    // 정상 — 빈 상태는 Table 의 emptyMessage 에 위임 (data-display.md §5.1).
    return (
      <Table<User>
        columns={columns}
        rows={usersQuery.data ?? []}
        getRowKey={(row) => row.id}
        emptyMessage="등록된 사용자가 없습니다."
      />
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">사용자</h1>
        <Button
          variant="contained"
          color="primary"
          label="+ 새 사용자"
          onClick={openModal}
        />
      </header>

      {renderBody()}

      <Modal
        isOpen={isModalOpen}
        title="새 사용자"
        size="md"
        confirmText={createMutation.isPending ? "저장 중…" : "저장"}
        cancelText="취소"
        onClose={closeModal}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              이메일<span className="text-red-red900 ml-0.5">*</span>
            </span>
            <Input
              value={formEmail}
              onChange={(v) => {
                setFormEmail(v);
                if (formErrors.email) {
                  setFormErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="name@company.com"
              error={!!formErrors.email}
              errorMessage={formErrors.email}
              autoComplete="email"
              full
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              이름<span className="text-red-red900 ml-0.5">*</span>
            </span>
            <Input
              value={formName}
              onChange={(v) => {
                setFormName(v);
                if (formErrors.name) {
                  setFormErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="예: 박도윤"
              error={!!formErrors.name}
              errorMessage={formErrors.name}
              allowSpaces
              maxLength={100}
              full
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}

export default UserListPage;
