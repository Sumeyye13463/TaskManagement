import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AdminLayout from "./layouts/AdminLayout";
import AdminHome from "./pages/Admin/AdminHome";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminLogin from "./pages/Admin/AdminLogin";
import "./style.css"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  );
}
