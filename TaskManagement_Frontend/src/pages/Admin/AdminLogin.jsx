import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // const res = await api.post("/admin/login", form);
      // const { email, role } = res.data.user;
      // DEMO:
      const email = form.email || "admin@example.com";
      const role = "admin";

      setUser({ email, role });
      localStorage.setItem("demo_user", JSON.stringify({ email, role }));

      navigate("/admin", { replace: true });
    } catch (e) {
      setErr("Giriş başarısız");
    }
  };

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 360, margin: "40px auto" }}>
      <h2>Admin Giriş</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Şifre"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Giriş</button>
      </form>
      {err && <div style={{ color: "salmon" }}>{err}</div>}
    </div>
  );
}
