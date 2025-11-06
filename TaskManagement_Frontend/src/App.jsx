// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";

// Admin
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminRegister from "./pages/Admin/AdminRegister";
import AdminLayout from "./layouts/AdminLayout";
import AdminHome from "./pages/Admin/AdminHome";
import AdminUsers from "./pages/Admin/AdminUsers";

// User (PM tarafı)
import UserLogin from "./pages/Auth/UserLogin";
import UserRegister from "./pages/Auth/UserRegister";
import PMLayout from "./layouts/PMLayout";
import Projects from "./pages/PM/Projects";

import RoleGuard from "./components/RoleGuard";

export default function App() {
  return (
    <Routes>
  <Route path="/" element={<Landing />} />

  {/* ❗ Korumasız auth rotaları */}
  <Route path="/admin/login" element={<AdminLogin />} />
  <Route path="/admin/register" element={<AdminRegister />} />
  <Route path="/login" element={<UserLogin />} />
  <Route path="/register" element={<UserRegister />} />

  {/* Admin alanı */}
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminHome />} />
    <Route path="users" element={<AdminUsers />} />
  </Route>

  {/* PM alanı */}
  <Route
    path="/pm"
    element={
      <RoleGuard allow={["project_manager", "admin"]}>
        <PMLayout />
      </RoleGuard>
    }
  >
    <Route index element={<Projects />} />
    <Route path="projects" element={<Projects />} />
  </Route>

  <Route path="*" element={<div>Not Found</div>} />
</Routes>
  );
}
