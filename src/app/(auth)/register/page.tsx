"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, {
    ok: false,
    message: "",
  });

  return (
    <main
      style={{
        maxWidth: 420,
        margin: "40px auto",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      <h1>Регистрация</h1>

      <form action={action} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Email
          <input
            name="username"
            type="string"
            required
            placeholder="you@example.com"
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Пароль
          <input
            name="password"
            type="password"
            required
            minLength={8}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        {state?.message && !pending && (
          <div style={{ color: state.ok ? "green" : "crimson" }}>
            {state.message}
          </div>
        )}

        <button type="submit" disabled={pending} style={{ padding: 10 }}>
          {pending ? "Создаём..." : "Зарегистрироваться"}
        </button>
      </form>
    </main>
  );
}
