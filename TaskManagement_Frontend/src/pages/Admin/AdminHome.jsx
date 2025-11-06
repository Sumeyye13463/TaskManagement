import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function AdminHome() {
  const { user } = useAuth();

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Yönetim Paneli</h1>
      <div>
        Giriş yapan: <strong>{user?.email || " "}</strong>
      </div>

      <Link
        to="/admin/users"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 8,
          background: "#0e1328",
          color: "#fff",
          textDecoration: "none",
          width: "fit-content",
          fontWeight: 600,
        }}
      >
        Kullanıcıları Yönet
      </Link>
    </div>
  );
}
