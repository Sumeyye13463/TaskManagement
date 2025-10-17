import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("pm.user");
    if (raw) setUser(JSON.parse(raw));
  }, []);

  async function login(email, password) {
    const res = await useApi.post("/auth/login", { email, password });
    const payload = res.data.user;
    setUser(payload);
    localStorage.setItem("pm.user", JSON.stringify(payload));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("pm.user");
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
