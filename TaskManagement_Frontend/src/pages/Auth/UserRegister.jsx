// src/pages/Auth/UserRegister.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function UserRegister() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // src/pages/Auth/UserRegister.jsx (submit içinde)
// src/pages/Auth/UserRegister.jsx (submit fonksiyonu)
// src/pages/Auth/UserLogin.jsx
// src/pages/Auth/UserRegister.jsx
const submit = async (e) => {
  e.preventDefault();
  setErr("");

  if (!form.username || !form.email || !form.password || !form.confirm) {
    return setErr("Tüm alanları doldurun");
  }
  if (form.password !== form.confirm) {
    return setErr("Şifreler eşleşmiyor");
  }

  setLoading(true);
  try {
    const { data, status } = await api.post("/auth/register", {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (status === 200 || status === 201) {
      navigate("/login", { replace: true }); // kayıt sonrası login sayfası
    }
  } catch (err) {
    const s = err?.response?.status;
    if (s === 409) setErr("Bu e-posta veya kullanıcı adı zaten kayıtlı.");
    else setErr(err?.response?.data?.message || err.message || "Kayıt başarısız");
  } finally {
    setLoading(false);
  }
};



  // ——— Stil: UserLogin/AdminLogin ile birebir kart görünüm ———
  const pageStyle = {
    position: "fixed",
    inset: 0,
    display: "grid",
    placeItems: "center",
    background: "#0e0f10",
    color: "#fff",
  };
  const cardStyle = {
    width: "100%",
    maxWidth: 520,
    background: "#222526",
    padding: 28,
    borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,.45)",
  };
  const formStyle = { display: "flex", flexDirection: "column", gap: 12, marginTop: 12 };
  const labelStyle = { display: "flex", flexDirection: "column", gap: 6, color: "#fff" };
  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #333",
    background: "#111518",
    color: "#fff",
    outline: "none",
  };
  const btnStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#0e7c66",
    color: "#fff",
    cursor: "pointer",
    marginTop: 6,
  };
  const footerStyle = { textAlign: "center", fontSize: 14, marginTop: 10, color: "#dcdcdc" };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h3 style={{ textAlign: "center", margin: 0 }}>Kullanıcı Kayıt</h3>

        <form onSubmit={submit} style={formStyle}>


          <label style={labelStyle}>
            Kullanıcı Adı
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={change}
              style={inputStyle}
              required
            />
          </label>        

          <label style={labelStyle}>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Şifre
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Şifre (Tekrar)
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={change}
              style={inputStyle}
              required
            />
          </label>

          {err && <div style={{ color: "salmon" }}>{err}</div>}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Kayıt yapılıyor…" : "Kayıt Ol"}
          </button>
        </form>

        <p style={footerStyle}>
          Zaten hesabınız var mı?{" "}
          <Link to="/login" style={{ color: "#10b981", textDecoration: "none" }}>
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
