import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:4000/api" });

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("pm.auth");
  if (raw) {
    const { accessToken } = JSON.parse(raw);
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
// → Authorization header
api.interceptors.request.use((config) => {
  // Her iki ihtimali de destekle (sen bazen 'accessToken', bazen 'pm.auth' kullanmışsın)
  const rawAuth = localStorage.getItem("pm.auth");
  const accessToken =
    JSON.parse(rawAuth || "{}")?.accessToken ||
    localStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Güven olsun diye POST/PUT/PATCH isteklerinde JSON header’ı koru
  if (["post", "put", "patch"].includes((config.method || "").toLowerCase())) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// (isteğe bağlı) gelen 400 hatalarında backend'den gelen detayları konsola yaz
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 400) {
      // teşhis için
      // eslint-disable-next-line no-console
      console.log("HTTP 400 →", err.response.data);
    }
    return Promise.reject(err);
  }
);

export default api;
