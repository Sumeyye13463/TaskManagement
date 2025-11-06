import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PMLayout(){
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <header className="flex items-center gap-4 px-5 py-3 border-b border-[#333]">
        <div className="font-semibold">Proje Yöneticisi Paneli</div>
        <nav className="flex gap-3 ml-6">
          <Link to="/pm/projects">Projeler</Link>
        </nav>
        <div className="ml-auto flex gap-3 items-center">
          <span className="opacity-80">{user?.email ?? "—"}</span>
          <button onClick={logout} className="bg-[#0e1328] px-3 py-1.5 rounded">Çıkış</button>
        </div>
      </header>
      <main className="p-5">
        <Outlet />
      </main>
    </div>
  );
}
