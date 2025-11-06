// src/pages/Admin/AdminLogin.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom"; // Link kaldırıldı
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";

const Schema = z.object({
  email: z.string().email("Geçerli e-posta"),
  password: z.string().min(6, "En az 6 karakter"),
});

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(Schema),
    defaultValues: { email: "", password: "" },
  });
  const [serverError, setServerError] = useState(null);

  const onSubmit = async (v) => {
    setServerError(null);
    try {
      await loginAdmin(v.email, v.password);
      navigate(from, { replace: true });
    } catch (e) {
      setServerError(e?.response?.data?.message || "Giriş başarısız");
    }
  };

  // ——— Kart stili (UserLogin ile aynı) ———
  const pageStyle = { position:"fixed", inset:0, display:"grid", placeItems:"center", background:"#0e0f10", color:"#fff" };
  const cardStyle = { width:"100%", maxWidth:520, background:"#222526", padding:28, borderRadius:16, boxShadow:"0 24px 60px rgba(0,0,0,.45)" };
  const formStyle = { display:"flex", flexDirection:"column", gap:12, marginTop:12 };
  const labelStyle = { display:"flex", flexDirection:"column", gap:6, color:"#fff" };
  const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid #333", background:"#111518", color:"#fff", outline:"none" };
  const btnStyle = { width:"100%", padding:"12px 16px", borderRadius:12, border:"none", background:"#0e7c66", color:"#fff", cursor:"pointer", marginTop:6 };
  const footerStyle = { textAlign:"center", fontSize:14, marginTop:10, color:"#dcdcdc" };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign:"center", margin:0 }}>Mirox</h1>
        <h3 style={{ textAlign:"center", marginTop:4, marginBottom:10 }}>Admin Girişi</h3>

        <form onSubmit={handleSubmit(onSubmit)} style={formStyle}>
          <label style={labelStyle}>
            E-posta
            <input type="email" {...register("email")} style={inputStyle} />
            {errors.email && <small style={{ color:"salmon" }}>{errors.email.message}</small>}
          </label>

          <label style={labelStyle}>
            Şifre
            <input type="password" {...register("password")} style={inputStyle} />
            {errors.password && <small style={{ color:"salmon" }}>{errors.password.message}</small>}
          </label>

          {serverError && <div style={{ color:"salmon" }}>{serverError}</div>}

          <button disabled={isSubmitting} type="submit" style={btnStyle}>
            {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>

        {/* Link yerine buton + navigate: form submit’e takılmaz */}
        <p style={footerStyle}>
          Hesabınız yok mu?{" "}
         <button
  type="button"
  onClick={() => navigate("/admin/register")}
  style={{ background:"transparent", border:"none", color:"#10b981", cursor:"pointer", padding:0 }}
>
  Kayıt olun
</button>
        </p>
      </div>
    </div>
  );
}
