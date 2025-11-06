// src/pages/Auth/UserLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function UserLogin() {
  const navigate = useNavigate();
  const { login } = useAuth(); // varsa context login'i de çağıracağız

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.email || !form.password) {
      return setErr("E-posta ve şifre gerekli");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      // Backend yanıtı ör: { accessToken, user: { id, email, role } }
      const accessToken =
        data?.accessToken || data?.token || data?.data?.accessToken;
      const user = data?.user || data?.data?.user;

      if (!accessToken) throw new Error("Token alınamadı");

      // Token'ı sakla ve axios default header'a koy
      localStorage.setItem("accessToken", accessToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      // Context varsa bilgilendir
      if (typeof login === "function") {
        login({ user, accessToken });
      }

      navigate("/pm/projects", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  // — Stil (AdminLogin/UserLogin kart görünümü ile aynı) —
  const pageStyle = {
    display: "grid",
    placeItems: "center",
    height: "100vh",
    background: "#0e0f10",
    color: "#fff",
  };
  const cardStyle = {
    background: "#222526",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 24px 60px rgba(0,0,0,.45)",
    width: "100%",
    maxWidth: 520,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };
  const inputStyle = {
    background: "#111518",
    border: "1px solid #333",
    borderRadius: "12px",
    color: "#fff",
    padding: "12px 14px",
    outline: "none",
    width: "100%",
  };
  const btnStyle = {
    background: "#0e7c66",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    width: "100%",
  };

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={submit}>
        <h1 style={{ textAlign: "center", marginBottom: "-0.5rem" }}>Mirox</h1>
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

        <button disabled={loading} type="submit" style={btnStyle}>
          {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>

        <p style={{ textAlign: "center", marginTop: 8 }}>
          Hesabınız yok mu?{" "}
          <a href="/register" style={{ color: "#10b981", textDecoration: "none" }}>
            Kayıt olun
          </a>
        </p>
      </form>
    </div>
  );
}
