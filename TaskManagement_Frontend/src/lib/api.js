// src/lib/api.js
import axios from "axios";

/** Backend hazır olunca FALSE yap. */
const USE_MOCK = true;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// ---- MOCK DB ----
const seed = {
  user: { id: 1, email: "admin@mirox.com", username: "Admin", role: "admin" },
};

async function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

api.mockPost = async (url, body) => {
  await delay();
  if (url === "/auth/login") {
    if (body.email === "admin@mirox.com" && body.password === "123456") {
      return { data: { user: seed.user, accessToken: "fake-token" } };
    }
    const e = new Error("E-posta veya şifre hatalı");
    e.response = { status: 401, data: { message: e.message } };
    throw e;
  }
  return { data: { success: true } };
};

api.mockGet = async (url) => {
  await delay();
  if (url === "/health") return { data: { ok: true, mode: "mock" } };
  throw new Error("MOCK GET bilinmeyen url: " + url);
};

/** Dışarıya tek kapı */
export const useApi = {
  post: (url, body, cfg) => (USE_MOCK ? api.mockPost(url, body, cfg) : api.post(url, body, cfg)),
  get: (url, cfg) => (USE_MOCK ? api.mockGet(url, cfg) : api.get(url, cfg)),
};
