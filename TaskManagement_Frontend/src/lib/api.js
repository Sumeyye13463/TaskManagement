// src/lib/api.js
import axios from "axios";
const USE_MOCK = true;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

const seed = {
  admin:  { id: 1, email: "admin@mirox.com", username: "Admin", role: "admin" },
  member: { id: 7, username: "Çalışan", role: "member" },
};

async function delay(ms = 300) { return new Promise(r => setTimeout(r, ms)); }

api.mockPost = async (url, body) => {
  await delay();
  if (url === "/auth/login") {
    // Admin girişi (email + password)
    if (body.email && body.password) {
      if (body.email === "admin@mirox.com" && body.password === "123456") {
        return { data: { user: seed.admin, accessToken: "fake-admin" } };
      }
      const e = new Error("E-posta veya şifre hatalı");
      e.response = { status: 401, data: { message: e.message } };
      throw e;
    }
    // Çalışan/PM girişi (inviteCode + password)
    if (body.inviteCode && body.password) {
      if (body.inviteCode === "MIROX-INVITE" && body.password === "123456") {
        return { data: { user: seed.member, accessToken: "fake-member" } };
      }
      const e = new Error("Davet kodu veya şifre hatalı");
      e.response = { status: 401, data: { message: e.message } };
      throw e;
    }
  }

  if (url === "/auth/register") {
    // Admin register
    if (!body?.email || !body?.password) {
      const e = new Error("Eksik bilgi");
      e.response = { status: 400, data: { message: e.message } };
      throw e;
    }
    return { data: { user: seed.admin, accessToken: "fake-admin" } };
  }

  return { data: { success: true } };
};

api.mockGet = async (url) => {
  await delay();
  if (url === "/health") return { data: { ok: true, mode: "mock" } };
  throw new Error("MOCK GET bilinmeyen url: " + url);
};

export const useApi = {
  post: (url, body, cfg) => (USE_MOCK ? api.mockPost(url, body, cfg) : api.post(url, body, cfg)),
  get: (url, cfg) => (USE_MOCK ? api.mockGet(url, cfg) : api.get(url, cfg)),
};
