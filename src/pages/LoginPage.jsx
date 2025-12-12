import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginPage({ cardClass }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e2) {
      setErr(e2?.message || "Login error");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <section className={cardClass}>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          {mode === "login" ? "Log in" : "Create account"}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded bg-black border border-gray-700 p-2 text-gray-100"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded bg-black border border-gray-700 p-2 text-gray-100"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <p className="text-xs text-red-300">{err}</p>}

          <button
            className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
            type="submit"
          >
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
          className="mt-3 text-xs text-gray-300 hover:text-red-300"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Have an account? Log in"}
        </button>
      </section>
    </div>
  );
}
