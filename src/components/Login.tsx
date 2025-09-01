import React, { useState } from "react";
import { login, register } from "../auth";

export default function Login({
  onSuccess,
  onBackHome,
}: {
  onSuccess: (email: string) => void;
  onBackHome: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const user =
        mode === "login" ? login(email, password) : register(email, password);
      onSuccess(user.email);
    } catch (e: any) {
      setErr(e.message || "Failed");
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
        <input
          type="email"
          placeholder="you@student.csulb.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          inputMode="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPass(e.target.value)}
          required
        />
        {err && <div className="err">{err}</div>}
        <button className="primary" type="submit">
          {mode === "login" ? "Continue" : "Register"}
        </button>

        <button
          type="button"
          className="ghost"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Create one" : "Have an account? Log in"}
        </button>

        <button type="button" className="link" onClick={onBackHome}>
          ← Back to Home
        </button>
      </form>
    </div>
  );
}
