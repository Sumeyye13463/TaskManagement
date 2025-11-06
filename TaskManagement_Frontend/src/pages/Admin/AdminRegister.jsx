import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Schema = z
  .object({
    adminName: z.string().min(2, "Ad gerekli"),
    companyEmail: z.string().email("Geçerli e-posta"),
    password: z.string().min(6, "En az 6 karakter"),
    confirm: z.string().min(6, "En az 6 karakter"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm"],
  });

export default function AdminRegister() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(Schema),
    defaultValues: {
      adminName: "",
      companyEmail: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (v) => {
    try {
      await registerAdmin({
        username: v.adminName,
        email: v.companyEmail,
        password: v.password,
      });
      navigate("/admin", { replace: true });
    } catch (e) {
      console.error(e);
    }
  };

  // 🎨 Stil tanımları
  const pageStyle = {
    display: "grid",
    placeItems: "center",
    height: "100vh",
    background: "#0e0f10",
    color: "#fff",
  };
  const cardStyle = {
    background: "#222526",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };
  const inputStyle = {
    background: "#111518",
    border: "1px solid #333",
    borderRadius: "12px",
    color: "#fff",
    padding: "12px 14px",
    outline: "none",
  };
  const buttonStyle = {
    background: "#0e7c66",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
  };
  const smallErrorStyle = { color: "salmon", fontSize: "0.85rem" };

  return (
    <div style={pageStyle}>
      <form style={cardStyle} onSubmit={handleSubmit(onSubmit)}>
        <h1 style={{ textAlign: "center", marginBottom: "-0.5rem" }}>Mirox</h1>
        <h3 style={{ textAlign: "center", marginTop: "-8px" }}>Admin Kayıt</h3>

        <label>
          Admin adı
          <input
            type="text"
            {...register("adminName")}
            style={inputStyle}
            placeholder="Adınızı girin"
          />
          {errors.adminName && (
            <small style={smallErrorStyle}>{errors.adminName.message}</small>
          )}
        </label>

        <label>
          Şirket maili
          <input
            type="email"
            {...register("companyEmail")}
            style={inputStyle}
            placeholder="E-posta adresi"
          />
          {errors.companyEmail && (
            <small style={smallErrorStyle}>
              {errors.companyEmail.message}
            </small>
          )}
        </label>

        <label>
          Şifre
          <input
            type="password"
            {...register("password")}
            style={inputStyle}
            placeholder="Şifrenizi girin"
          />
          {errors.password && (
            <small style={smallErrorStyle}>{errors.password.message}</small>
          )}
        </label>

        <label>
          Şifre tekrar
          <input
            type="password"
            {...register("confirm")}
            style={inputStyle}
            placeholder="Şifrenizi tekrar girin"
          />
          {errors.confirm && (
            <small style={smallErrorStyle}>{errors.confirm.message}</small>
          )}
        </label>

        <button disabled={isSubmitting} type="submit" style={buttonStyle}>
          {isSubmitting ? "Kayıt yapılıyor..." : "Kayıt Yap"}
        </button>

        <p style={{ textAlign: "center", marginTop: 8 }}>
          Zaten hesabınız var mı?{" "}
          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            style={{
              background: "transparent",
              border: "none",
              color: "#10b981",
              cursor: "pointer",
            }}
          >
            Giriş yapın
          </button>
        </p>
      </form>
    </div>
  );
}
