"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Неверный пароль");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="panel" style={{ maxWidth: 420, margin: "40px auto" }}>
        <img src="/brand/taland-logo-dark.png" alt="ТаланД" style={{ height: 72, margin: "0 auto 12px" }} />
        <h2>Вход для сотрудников</h2>
        {error ? <p className="form-error">{error}</p> : null}
        <form className="fields" onSubmit={submit}>
          <label>Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="admin-password" /></label>
          <button className="btn btn--main" type="submit" disabled={pending}>Войти</button>
        </form>
        <p className="fine">Пароль задаётся в ADMIN_PASSWORD. На локальном стенде это значение из .env, его нужно сменить перед публикацией.</p>
      </div>
    </main>
  );
}
