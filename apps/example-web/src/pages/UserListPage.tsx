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
  const { data, isLoading, isError, error } = useUsersQuery();
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

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (isError)
    return (
      <p className="p-6 text-red-red600">
        Error: {(error as Error).message}
      </p>
    );

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
      <Table
        columns={columns}
        rows={users}
        getRowKey={(row) => row.id}
        emptyMessage="No users yet."
      />
    </div>
  );
}

export default UserListPage;
