import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#2f2f2f", color: "#fff" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 20px",
          borderBottom: "1px solid #3a3a3a",
        }}
      >
        {/* Sol: sabit başlık */}
        <div style={{ fontWeight: 700 }}>Admin Sayfasına Hoş Geldiniz</div>

        {/* Orta: menü 
        <nav style={{ display: "flex", gap: 12, marginLeft: 24 }}>
          <Link to="/admin" style={{ color: "#fff", textDecoration: "none" }}>
            Ana Sayfa
          </Link>
          <Link
            to="/admin/users"
            style={{ color: "#fff", textDecoration: "none" }}
          >
            Kullanıcıları Yönet
          </Link>
        </nav>*/}

        {/* Sağ: e-posta + çıkış */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <span style={{ opacity: 0.9 }}>{user?.email ?? "—"}</span>
          <button
            onClick={logout}
            style={{
              background: "#0e1328",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Çıkış
          </button>
        </div>
      </header>

      <main style={{ padding: 20 }}>
        <Outlet /> {/* 🔑 çocuk route'lar burada render edilir */}
      </main>
    </div>
  );
}
