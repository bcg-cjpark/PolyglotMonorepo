import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataGrid } from "@monorepo/ui";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
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

  const columnDefs = useMemo<ColDef<User>[]>(
    () => [
      { field: "id", headerName: "ID", maxWidth: 80 },
      { field: "email", headerName: "Email" },
      { field: "name", headerName: "Name" },
      {
        headerName: "",
        colId: "action",
        maxWidth: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<User>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <Button
              variant="outlined"
              color="red"
              size="sm"
              label="Delete"
              onClick={() => handleDelete(row.id)}
            />
          );
        },
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
      <DataGrid
        columnDefs={columnDefs}
        rowData={users}
        height="calc(100vh - 200px)"
        noRowsToShow="No users yet."
        disableRowSelection
      />
    </div>
  );
}

export default UserListPage;
