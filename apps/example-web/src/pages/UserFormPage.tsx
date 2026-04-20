import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@monorepo/ui";
import { UserApi } from "../services/users";

function UserFormPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await UserApi.create({ email, name });
      navigate("/users");
    } finally {
      setSubmitting(false);
    }
  };

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
