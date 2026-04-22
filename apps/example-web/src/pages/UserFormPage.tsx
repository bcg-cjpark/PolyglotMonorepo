import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@monorepo/ui";
import { useCreateUserMutation } from "../queries/users";

function UserFormPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const createUser = useCreateUserMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({ email, name });
      navigate("/users");
    } catch {
      // 에러는 뮤테이션의 isError / error 로 노출 가능. 현 화면은 별도 UI 없이 이전 동작 유지.
    }
  };

  const submitting = createUser.isPending;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">New User</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <Input
            value={email}
            placeholder="user@example.com"
            full
            onChange={(v) => setEmail(v)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Name</span>
          <Input
            value={name}
            placeholder="Full name"
            full
            allowSpaces
            onChange={(v) => setName(v)}
          />
        </label>
        <div className="flex gap-2">
          <Button
            buttonType="submit"
            variant="contained"
            color="primary"
            label={submitting ? "Saving…" : "Create"}
            disabled={submitting}
          />
          <Button
            buttonType="button"
            variant="outlined"
            color="grey"
            label="Cancel"
            onClick={() => navigate("/users")}
          />
        </div>
      </form>
    </div>
  );
}

export default UserFormPage;
