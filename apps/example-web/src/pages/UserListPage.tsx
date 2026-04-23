import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Table, type TableColumn } from "@monorepo/ui";
import { User } from "../services/users";
import {
  useDeleteUserMutation,
  useUsersQuery,
} from "../queries/users";

function UserListPage() {
  const navigate = useNavigate();
  // error 객체는 의도적으로 구독하지 않음 — 사용자에게는 일반 한국어 메시지만 노출.
  const { data, isLoading, isError } = useUsersQuery();
  const deleteUser = useDeleteUserMutation();

  const users = data ?? [];

  const handleDelete = (id: number) => {
    deleteUser.mutate(id);
  };

  const columns = useMemo<TableColumn<User>[]>(
    () => [
      { key: "id", header: "ID", width: "80px" },
      { key: "email", header: "Email" },
      { key: "name", header: "Name" },
      {
        key: "action",
        header: "",
        align: "right",
        width: "120px",
        render: (row) => (
          <Button
            variant="outlined"
            color="red"
            size="sm"
            label="Delete"
            onClick={() => handleDelete(row.id)}
          />
        ),
      },
    ],
    // handleDelete 는 deleteUser 뮤테이션을 닫아서 호출하므로 안정.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // 헤더(제목 + "+ New") 는 Loading/Error 중에도 유지. 본문만 상태 뷰로 치환.
  // 디자인 노트: docs/design-notes/global-states.md §2, §4
  const renderBody = () => {
    if (isLoading) {
      return <p className="py-12 text-center text-muted">불러오는 중…</p>;
    }
    if (isError) {
      // 스택 트레이스 노출 금지 — raw error.message 대신 한국어 일반 메시지.
      return (
        <p className="py-12 text-center text-red-red600">
          목록을 불러오지 못했습니다.
        </p>
      );
    }
    return (
      <Table
        columns={columns}
        rows={users}
        getRowKey={(row) => row.id}
        emptyMessage="No users yet."
      />
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button
          variant="contained"
          color="primary"
          size="md"
          label="+ New"
          onClick={() => navigate("/users/new")}
        />
      </div>
      {renderBody()}
    </div>
  );
}

export default UserListPage;
