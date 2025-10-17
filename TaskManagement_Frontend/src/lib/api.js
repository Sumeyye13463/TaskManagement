// src/lib/api.js
const USE_MOCK = true; // backend'e bağlandığında false yap

// --- gerçek axios config ---
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// --- mock veriler ---
const mockData = {
  "/auth/login": { user: { id: 1, email: "test@mirox.com" }, accessToken: "fake-token" },
  "/projects": [
    { id: 1, name: "Web Panel", client_name: "ACME Ltd.", manager_username: "Sümeyye", created_at: "2025-10-17" },
    { id: 2, name: "Mobil Uygulama", client_name: "TechNova", manager_username: "Ali", created_at: "2025-10-15" },
  ],
  "/projects/1": { id: 1, name: "Web Panel", description: "Yönetici arayüzü geliştirmesi" },
  "/tasks": [
    { id: 1, title: "Login ekranı", status: "done", dueDate: "2025-10-20" },
    { id: 2, title: "Dashboard tasarımı", status: "todo" },
  ],
};

// --- mock handler ---
api.mockGet = async (url) => {
  console.log("[MOCK GET]", url);
  await new Promise((r) => setTimeout(r, 300)); // gecikme efekti
  if (mockData[url]) return { data: mockData[url] };
  if (url.startsWith("/projects/")) return { data: mockData["/projects/1"] };
  if (url.startsWith("/tasks")) return { data: mockData["/tasks"] };
  throw new Error("Mock veri bulunamadı: " + url);
};

api.mockPost = async (url, body) => {
  console.log("[MOCK POST]", url, body);
  await new Promise((r) => setTimeout(r, 300));
  if (url === "/auth/login") return { data: mockData["/auth/login"] };
  return { data: { success: true } };
};

// --- proxy wrapper ---
export const useApi = {
  get: (...args) => (USE_MOCK ? api.mockGet(...args) : api.get(...args)),
  post: (...args) => (USE_MOCK ? api.mockPost(...args) : api.post(...args)),
};
