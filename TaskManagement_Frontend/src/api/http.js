// src/api/http.js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:4000/api" });

// 🔐 Authorization & JSON header (tek interceptor)
api.interceptors.request.use((config) => {
  // 1) pm.auth içinden token (tercihli)
  const rawAuth = localStorage.getItem("pm.auth");
  const tokenFromPmAuth = rawAuth ? JSON.parse(rawAuth)?.accessToken : null;

  // 2) fallback: accessToken anahtarından
  const token = tokenFromPmAuth || localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Yazma isteklerinde JSON header'ı koru
  const method = (config.method || "").toLowerCase();
  if (["post", "put", "patch"].includes(method)) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// (opsiyonel) 400 hata detayını konsola yaz (teşhis kolaylığı)
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 400) {
      // eslint-disable-next-line no-console
      console.log("HTTP 400 →", err.response.data);
    }
    return Promise.reject(err);
  }
);

export default api;
