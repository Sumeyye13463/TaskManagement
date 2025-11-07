// RoleGuard.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ allow = [], children }) {
  const { user, accessToken, isAuthReady } = useAuth();
  const location = useLocation();

  // Auth sayfaları: asla engelleme
  const AUTH_PATHS = ["/admin/login", "/admin/register", "/login", "/register"];
  if (AUTH_PATHS.includes(location.pathname)) return children;

  // src/components/RoleGuard.jsx
if (!isAuthReady) return null;
if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;
//if (allow.length) {
 // if (!user?.role) return null;                 // ← rol gelene kadar bekle
 // if (!allow.includes(user.role)) return <Navigate to="/" replace />;
//}
return children;

}
