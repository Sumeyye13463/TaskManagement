import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="center" style={{backgroundColor: "#2f2f2f"}}>
      <div className="card" style={{ textAlign: "center"  }}>
        <h1 className="title">Mirox</h1>
        <button onClick={() => navigate("/login")}>Kullanıcı girişi yap</button>
        <button onClick={() => navigate("/admin/login")}>Admin girişi yap</button>
      </div>
    </div>
  );
}
