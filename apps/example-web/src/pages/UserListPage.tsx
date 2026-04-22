import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataGrid } from "@monorepo/ui";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { UserApi, User } from "../services/users";

function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await UserApi.list());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    await UserApi.delete(id);
    await load();
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
    [],
  );

  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-red600">Error: {error}</p>;

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
