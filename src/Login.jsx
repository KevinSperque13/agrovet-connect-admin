
import { useState } from "react";
import { supabase } from "./services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);

    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>AgroVet Connect</h1>
        <p style={styles.subtitle}>Painel administrativo</p>

        <div style={styles.field}>
          <label style={styles.label}>E-mail</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Senha</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} disabled={loading}>
          {loading ? "Entrando..." : "Entrar no sistema"}
        </button>
      </form>
    </main>
  );
}


const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
    fontFamily: "Arial, sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },
  title: {
    color: "#166534",
    textAlign: "center",
    fontSize: "25px",
    margin: "0 0 5px",
    lineHeight: "1.3",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
    margin: "0 0 24px",
  },
  field: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#334155",
  },
  input: {
    width: "100%",
    height: "42px",
    padding: "0 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    height: "43px",
    marginTop: "2px",
    background: "#15803d",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    margin: "0 0 12px",
  },
};

