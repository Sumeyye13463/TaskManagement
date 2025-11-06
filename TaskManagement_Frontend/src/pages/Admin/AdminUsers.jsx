// src/pages/Admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/http";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsers() {
  const { accessToken } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    title: "",
    role: "member",
    password: "",
    phone: "",
  });

  const [sendingFirst, setSendingFirst] = useState(false);

  // "Kod Gönder" tıklandığında ilk giriş linki mailini yollar
const sendFirstLogin = async () => {
  if (!form.email?.trim()) {
    alert("Kod göndermek için e-posta alanını doldur.");
    return;
  }
  setSendingFirst(true);
  try {
   await api.post("/users/first-login-email", { email: form.email.trim() });
    alert("İlk giriş linki gönderildi.");
  } catch (err) {
    console.error(err);
    alert(err?.response?.data?.message || "Gönderim başarısız.");
  } finally {
    setSendingFirst(false);
  }
};

  // güçlü geçici şifre üretici
const genTempPassword = () => {
  const len = 12;
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = letters + digits + symbols;

  const pick = (set) => set[Math.floor(Math.random() * set.length)];

  // en az birer tür garanti
  let pwd = pick(letters) + pick(letters.toUpperCase()) + pick(digits) + pick(symbols);
  while (pwd.length < len) pwd += pick(all);
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
};


  // ⬇️ çift POST'u engellemek için dahili kilit
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr("");
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (e) {
      console.error(e);
      setErr("Kullanıcı listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

    const addUser = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        title: form.title || null,
        phone: form.phone || null,
        password: genTempPassword(), // 👈 sadece eklemede kullan
      };
      await api.post("/users", payload);
      setForm({ username: "", email: "", title: "", role: "member", phone: "" });
      await fetchUsers();
      // e-posta yok; kullanıcı eklenir ve beklemeden 201 döner
    } catch (e) {
      setErr(e?.response?.data?.message || "Kullanıcı eklenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Bu kullanıcıyı silmek istiyor musun?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      console.error(e);
      alert("Silme işlemi başarısız!");
    }
  };

  const toggleActive = async (id, next) => {
    try {
      await api.patch(`/users/${id}/active`, { is_active: next }); // endpoint varsa
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: next } : u)));
    } catch (e) {
      console.error(e);
      alert("Durum güncellenemedi.");
    }
  };

  const editUser = async (u) => {
    const roleInput = prompt("Rol (member | manager | admin):", u.role || "member");
    if (roleInput == null) return;
    const titleInput = prompt("Title (boş bırakılabilir):", u.title || "");
    try {
      // Şimdilik yalnızca title güncelle
      await api.patch(`/users/${u.id}`, { title: titleInput || null });
      await fetchUsers();
    } catch (eTitle) {
      console.warn("Title güncellenemedi:", eTitle?.response?.data || eTitle.message);
      alert("Güncelleme başarısız!\n" + (eTitle?.response?.data?.message || eTitle?.message || ""));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken]);

  return (
    <div style={{ minHeight: "100vh", background: "#2f2f2f", color: "#fff" }}>
      {/* Üst bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid #3a3a3a",
        }}
      >
        <div style={{ margin: "0 auto", fontSize: 24, fontWeight: 700 }}>Çalışan Ekle/ Sil</div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#111827",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span role="img" aria-label="avatar">
            👤
          </span>
        </div>
      </div>

      {/* İçerik */}
      <main style={{ padding: 16 }}>
        {err && <div style={{ color: "tomato", marginBottom: 8 }}>{err}</div>}
        {loading && <div style={{ marginBottom: 8 }}>Yükleniyor…</div>}

        {/* Ekleme formu */}
        <form
          onSubmit={addUser}
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
            background: "#1f2436",
            padding: 12,
            borderRadius: 10,
          }}
        >
          <input
            type="text"
            placeholder="Ad Soyad"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={inp}
          />
          <input
            type="email"
            placeholder="Mail"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inp}
          />
          <input
            type="tel"
            placeholder="Telefon (opsiyonel)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={inp}
            inputMode="tel"
            maxLength={20}
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={inp}
          >
            <option value="member">Çalışan</option>
            <option value="manager">Yönetici</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inp}
          />
           <div style={{ display: "flex", gap: 8 }}>
  <button type="submit" style={btn} disabled={saving}>
    {saving ? "Ekleniyor…" : "Ekle"}
  </button>

  <button
    type="button"
    onClick={sendFirstLogin}
    style={btn}
    disabled={sendingFirst}
  >
    {sendingFirst ? "Gönderiliyor…" : "Kod Gönder"}
  </button>
</div>
</form>
        {/* Tablo */}
        <div style={{ overflowX: "auto" }}>
          <table cellPadding={12} style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ textAlign: "left", background: "#1f2436" }}>
              <tr>
                <th style={th}>Aktif</th>
                <th style={th}>Sil</th>
                <th style={th}>✏️</th>
                <th style={th}>Ad Soyad</th>
                <th style={th}>Mail</th>
                <th style={th}>Telefon</th>
                <th style={th}>Rolü</th>
                <th style={th}>Title</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #2a2a2a" }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!u.is_active}
                      onChange={(e) => toggleActive(u.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <button onClick={() => deleteUser(u.id)} title="Sil" style={iconBtn}>
                      🚫
                    </button>
                  </td>
                  <td>
                    <button onClick={() => editUser(u)} title="Düzenle" style={iconBtn}>
                      ✏️
                    </button>
                  </td>
                  <td>
                    <span
                      style={{ fontWeight: 600, textDecoration: "underline", cursor: "default" }}
                    >
                      {u.username}
                    </span>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || "-"}</td>
                  <td>{u.role === "member" ? "Çalışan" : u.role === "manager" ? "Yönetici" : "Admin"}</td>
                  <td>{u.title || "-"}</td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ opacity: 0.75 }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const inp = {
  background: "#0e1328",
  border: "none",
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 8,
  minWidth: 180,
};

const btn = {
  background: "#0e1328",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

const th = { padding: 12 };

const iconBtn = {
  background: "#0e1328",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
};
