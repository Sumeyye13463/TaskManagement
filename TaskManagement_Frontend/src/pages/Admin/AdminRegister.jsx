import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Schema = z.object({
  adminName: z.string().min(2, "Ad gerekli"),
  companyEmail: z.string().email("Geçerli e-posta"),
  password: z.string().min(6, "En az 6 karakter"),
  confirm: z.string().min(6),
}).refine((d) => d.password === d.confirm, { message: "Şifreler eşleşmiyor", path: ["confirm"] });

export default function AdminRegister() {
  const { registerAdmin } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(Schema), defaultValues: { adminName: "", companyEmail: "", password: "", confirm: "" }
  });
  const [serverError, setServerError] = useState(null);

const onSubmit = async (v) => {
  setServerError(null);
  try {
       await registerAdmin({
             username: v.adminName,
             email: v.companyEmail,
             password: v.password
  });
    navigate("/admin", { replace: true });
  } catch (e) {
    setServerError(e?.response?.data?.message || "Kayıt başarısız");
  }
};

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit(onSubmit)}>

        <h1 className="title">Mirox</h1>
        <h3 style={{ marginTop: -8, textAlign: "center" }}>Admin Kayıt</h3>

        <label> Admin adı <input type="text" {...register("adminName")} /> {errors.adminName && <small className="small-error">{errors.adminName.message}</small>} </label>
        <label> Şirket maili <input type="email" {...register("companyEmail")} /> {errors.companyEmail && <small className="small-error">{errors.companyEmail.message}</small>} </label>
        <label> Şifre <input type="password" {...register("password")} /> {errors.password && <small className="small-error">{errors.password.message}</small>} </label>
        <label> Şifre tekrar <input type="password" {...register("confirm")} /> {errors.confirm && <small className="small-error">{errors.confirm.message}</small>} </label>
        
        {serverError && <div className="small-error">{serverError}</div>}
        <button disabled={isSubmitting} type="submit">{isSubmitting ? "Kayıt yapılıyor…" : "Kayıt Yap"}</button>
      </form>
    </div>
  );
}
