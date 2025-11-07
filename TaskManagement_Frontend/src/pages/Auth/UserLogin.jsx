// src/pages/Auth/UserLogin.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function UserLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.email || !form.password) {
      return setErr("E-posta ve şifre gerekli");
    }

    setLoading(true);
    try {
      const { data, status } = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const token =
        data?.accessToken ??
        data?.token ??
        data?.data?.accessToken ??
        data?.data?.token;

      const user = data?.user ?? data?.data?.user ?? (data?.id && data);

      if (!(status === 200 || status === 201) || !token) {
        throw new Error("Token alınamadı");
      }

      localStorage.setItem("accessToken", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      if (typeof login === "function") login({ user, accessToken: token });

      // Login başarılı -> doğrudan PM alanına
      navigate("/pm", { replace: true });
    } catch (er) {
      const s = er?.response?.status;
      if (s === 401) setErr("E-posta veya şifre hatalı.");
      else setErr(er?.response?.data?.message || er.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    display: "grid",
    minHeight: "100vh",
    placeItems: "center",
    background: "#0e0f10",
    color: "#fff",
  };
  const cardStyle = {
    width: "100%",
    maxWidth: 520,
    background: "#222526",
    padding: "2rem",
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,.45)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };
  const inputStyle = {
    width: "100%",
    background: "#111518",
    border: "1px solid #333",
    borderRadius: 12,
    color: "#fff",
    padding: "12px 14px",
  };
  const btnStyle = {
    background: "#0e7c66",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: 12,
    cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={submit}>
        <h1 style={{ textAlign: "center", marginBottom: "-.5rem" }}>Mirox</h1>
        <h3 style={{ textAlign: "center", marginTop: "-8px" }}>Kullanıcı Girişi</h3>

        <label>
          E-posta
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={change}
            style={inputStyle}
            placeholder="ornek@mail.com"
          />
        </label>

        <label>
          Şifre
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            style={inputStyle}
            placeholder="••••••••"
          />
        </label>

        {err && <div style={{ color: "salmon" }}>{err}</div>}

        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>

        <p style={{ textAlign: "center", marginTop: 8 }}>
          Hesabınız yok mu?{" "}
          <Link to="/register" style={{ color: "#10b981", textDecoration: "none" }}>
            Kayıt olun
          </Link>
        </p>
      </form>
    </div>
  );
}
