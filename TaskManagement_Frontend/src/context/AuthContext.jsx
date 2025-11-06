// örn. src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/http"; // senin axios instance yolun

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // { email, role }
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("demo_user");
      if (raw) setUser(JSON.parse(raw));
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  // Geçici yardımcılar (geliştirme için)
  const loginAsAdmin = (email = "admin@example.com") => {
    const u = { email, role: "admin" };
    localStorage.setItem("demo_user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("demo_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, isAuthReady, loginAsAdmin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
