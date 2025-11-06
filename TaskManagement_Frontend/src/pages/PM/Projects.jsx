import { useEffect, useState } from "react";
import { PMApi } from "../../api/pm";

export default function Projects(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "", start_date: "", end_date: "", client_id: "" });

  useEffect(()=>{
    (async ()=>{
      const { data } = await PMApi.listProjects();
      setRows(data.items || []);
      setLoading(false);
    })();
  },[]);

  const submit = async (e)=>{
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      client_id: form.client_id ? Number(form.client_id) : undefined
    };
    const { data } = await PMApi.createProject(payload);
    setRows(prev => [data, ...prev]);
    setForm({ name:"", description:"", start_date:"", end_date:"", client_id:"" });
  };

  if (loading) return <div>Yükleniyor…</div>;

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="bg-[#2a2a2a] p-4 rounded">
        <div className="grid gap-3 sm:grid-cols-5">
          <input className="bg-[#1e1e1e] p-2 rounded" placeholder="Proje adı"
                 value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))}/>
          <input type="date" className="bg-[#1e1e1e] p-2 rounded"
                 value={form.start_date} onChange={e=>setForm(f=>({...f, start_date:e.target.value}))}/>
          <input type="date" className="bg-[#1e1e1e] p-2 rounded"
                 value={form.end_date} onChange={e=>setForm(f=>({...f, end_date:e.target.value}))}/>
          <input className="bg-[#1e1e1e] p-2 rounded" placeholder="Client ID (opsiyonel)"
                 value={form.client_id} onChange={e=>setForm(f=>({...f, client_id:e.target.value}))}/>
          <button className="bg-[#0e7c66] rounded px-4">Oluştur</button>
        </div>
        <textarea className="bg-[#1e1e1e] p-2 rounded w-full mt-3" rows="3"
                  placeholder="Açıklama (opsiyonel)"
                  value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))}/>
      </form>

      <div className="overflow-auto">
        <table className="min-w-[900px] w-full">
          <thead>
            <tr className="text-left border-b border-[#3a3a3a]">
              <th className="p-2">ID</th>
              <th className="p-2">Ad</th>
              <th className="p-2">Client</th>
              <th className="p-2">Yönetici</th>
              <th className="p-2">Başlangıç</th>
              <th className="p-2">Bitiş</th>
              <th className="p-2">Güncellendi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p=>(
              <tr key={p.id} className="border-b border-[#333]">
                <td className="p-2">{p.id}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.client_id ?? "—"}</td>
                <td className="p-2">{p.manager_id ?? "—"}</td>
                <td className="p-2">{p.start_date ?? "—"}</td>
                <td className="p-2">{p.end_date ?? "—"}</td>
                <td className="p-2">{new Date(p.updated_at ?? p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
