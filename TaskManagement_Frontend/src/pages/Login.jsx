import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

const LoginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "En az 6 karakter"),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [serverError, setServerError] = useState(null);

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err?.response?.data?.message || "Giriş başarısız");
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="title">Mirox</h1>

        <label>
          E-posta
          <input type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email && <small className="small-error">{errors.email.message}</small>}
        </label>

        <label>
          Şifre
          <input type="password" placeholder="••••••" {...register("password")} />
          {errors.password && <small className="small-error">{errors.password.message}</small>}
        </label>

        {serverError && <div className="small-error">{serverError}</div>}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}