"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Не удалось отправить код");
      return;
    }
    setSent(true);
    setDevCode(data.devCode || "");
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Неверный код");
      return;
    }
    track("login_success");
    router.push("/account");
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="panel">
        <h2>Вход по телефону</h2>
        <p className="price-note">Тестовый режим: SMS не отправляется, код показывается здесь. Перед публикацией подключите шлюз и поставьте AUTH_MODE=sms.</p>
        {error ? <p className="form-error">{error}</p> : null}
        {!sent ? (
          <form className="fields" onSubmit={requestCode}>
            <label>Телефон<input className="ym-hide-content" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 …" type="tel" data-testid="login-phone" data-field="login_phone" /></label>
            <button className="btn btn--main" type="submit" disabled={pending} data-track="login_request_code">Получить код</button>
          </form>
        ) : (
          <form className="fields" onSubmit={verify}>
            {devCode ? <p>Тестовый код: <span className="dev-code" data-testid="dev-code">{devCode}</span></p> : <p>Код отправлен в SMS.</p>}
            <label>Код<input className="ym-hide-content" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="4 цифры" data-testid="login-code" /></label>
            <button className="btn btn--main" type="submit" disabled={pending} data-testid="login-submit" data-track="login_submit">Войти</button>
            <button className="btn btn--ghost" type="button" data-track="login_other_number" onClick={() => { setSent(false); setDevCode(""); }}>Другой номер</button>
          </form>
        )}
      </div>
    </main>
  );
}
