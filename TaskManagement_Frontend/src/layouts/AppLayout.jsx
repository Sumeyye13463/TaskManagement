import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 16 }}>
        <h2 style={{ marginBottom: 16 }}>Projeler</h2>
        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
        </nav>
        <div style={{ marginTop: "auto" }}>
          <div style={{ marginTop: 24, fontSize: 12, color: "#666" }}>Kullanıcı: {user?.email}</div>
          <button onClick={logout} style={{ marginTop: 12 }}>
            Çıkış
          </button>
        </div>
      </aside>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
