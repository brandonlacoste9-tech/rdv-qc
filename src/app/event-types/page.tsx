"use client";
import { useState, useEffect } from "react";

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/me").then(r => r.json()).then(data => {
      setEventTypes(data.eventTypes || []);
    }).finally(() => setLoading(false));
  }, []);

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
  };

  if (loading) return <div style={s.page}><div style={s.content}><p style={{color:"#898989"}}>Chargement...</p></div></div>;

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <a href="/" style={{ fontFamily:"'Cal Sans',sans-serif",fontSize:18,fontWeight:700,color:"#242424",textDecoration:"none",display:"block",marginBottom:24 }}>Planxo</a>
        <div style={{marginTop:"auto",paddingTop:20,borderTop:"1px solid rgba(0,0,0,0.04)"}}>
          <a href="/dashboard" style={{fontSize:13,color:"#898989",textDecoration:"none"}}>← Tableau de bord</a>
        </div>
      </div>
      <div style={s.content}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h1 style={{ fontFamily:"'Cal Sans',sans-serif",fontSize:24,fontWeight:700,marginBottom:4 }}>Types de rendez-vous</h1>
            <p style={{fontSize:14,color:"#898989"}}>Créez et gérez vos types de rendez-vous.</p>
          </div>
          <button style={{padding:"10px 20px",borderRadius:9999,background:"#242424",color:"#fff",border:"none",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>+ Nouveau</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {eventTypes.map((et: any) => (
            <div key={et.id} style={{padding:"16px 20px",borderRadius:10,border:"1px solid rgba(0,0,0,0.04)",background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .15s",cursor:"default"}} className="card-hover">
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:36,height:36,borderRadius:8,background:et.color||"#242424",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,flexShrink:0}}>
                  {et.title[0]}
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>{et.title}</div>
                  <div style={{fontSize:12,color:"#898989"}}>{et.length} min · {et.location} · /{et.slug}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={() => copyLink(et.slug)} style={{fontSize:12,color:"#242424",background:"#f9fafb",border:"1px solid rgba(0,0,0,0.08)",padding:"6px 12px",borderRadius:9999,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>📋 Copier le lien</button>
                <a href={`/${et.slug}`} target="_blank" style={{fontSize:12,color:"#0099ff",textDecoration:"none",padding:"6px 12px"}}>Aperçu →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif",color:"#242424",background:"#fff" },
  sidebar: { width: 220, padding: "28px 20px", borderRight: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", flexShrink: 0 },
  content: { flex: 1, padding: "40px 48px", maxWidth: 800 },
};
