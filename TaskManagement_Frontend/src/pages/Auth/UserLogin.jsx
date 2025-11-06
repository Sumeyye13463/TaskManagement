import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function UserLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      // DEMO:
      const email = form.email || "user@example.com";
      const role = "project_manager";
      setUser({ email, role });
      localStorage.setItem("demo_user", JSON.stringify({ email, role }));
      navigate("/pm/projects", { replace: true });
    } catch {
      setErr("Giriş başarısız");
    } finally { setLoading(false); }
  };

  const pageStyle = {
    position: "fixed", inset: 0, display: "grid", placeItems: "center",
    background: "#1f1f1f", color: "#fff"
  };
  const formStyle = {
    width: "100%", maxWidth: 400, background: "#2a2a2a",
    padding: 24, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.3)",
    display: "flex", flexDirection: "column", gap: 12,
  };
  const inputStyle = {
    background: "#1e1e1e", color: "#fff", border: "1px solid #333",
    padding: "12px 14px", borderRadius: 10, outline: "none",
  };
  const btnStyle = {
    background: "#0e7c66", color: "#fff", padding: "10px 14px",
    border: "none", borderRadius: 10, cursor: "pointer",
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: "center" }}>Kullanıcı Giriş</h2>

        <input name="email" type="email" placeholder="Email"
          value={form.email} onChange={change} style={inputStyle} required />
        <input name="password" type="password" placeholder="Şifre"
          value={form.password} onChange={change} style={inputStyle} required />

        {err && (
          <div style={{ color: "salmon", textAlign: "center", fontSize: 14 }}>
            {err}
          </div>
        )}

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Giriş yapılıyor..." : "Giriş"}
        </button>

        {/* ✅ Register linki */}
        <p style={{ textAlign: "center", fontSize: 14, marginTop: 8 }}>
          Hesabınız yok mu?{" "}
          <Link to="/register" style={{ color: "#10b981", textDecoration: "none" }}>
            Kayıt olun
          </Link>
        </p>
      </form>
    </div>
  );
}
