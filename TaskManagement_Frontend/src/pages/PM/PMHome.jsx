// src/pages/PM/PMHome.jsx
export default function PMHome() {
  const page = { padding: 20, color: "#fff" };
  const card = { background:"#222526", padding:20, borderRadius:16, boxShadow:"0 24px 60px rgba(0,0,0,.45)" };

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={{marginTop:0}}>Proje Yöneticisi Paneli</h2>
        <p>Hoş geldin! Soldaki menüden projeleri yönetebilir veya yeni proje ekleyebilirsin.</p>
      </div>
    </div>
  );
}