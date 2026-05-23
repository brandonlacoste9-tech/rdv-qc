"use client";
import { useState, useEffect } from "react";

type Tab = "profile" | "calendars" | "conferencing" | "api" | "appearance";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/me").then(r => r.json()).then(data => {
      setUser(data); setEventTypes(data.eventTypes || []);
    }).finally(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "profile", label: "Profil", icon: "👤" },
    { key: "calendars", label: "Calendriers", icon: "📅" },
    { key: "conferencing", label: "Visioconférence", icon: "📹" },
    { key: "api", label: "API & Dev", icon: "🔑" },
    { key: "appearance", label: "Apparence", icon: "🎨" },
  ];

  if (loading) return <div style={s.page}><div style={s.content}><p style={{color:"#898989",fontSize:14}}>Chargement...</p></div></div>;

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <a href="/" style={{ fontFamily:"'Cal Sans',sans-serif",fontSize:18,fontWeight:700,color:"#242424",textDecoration:"none",display:"block",marginBottom:24 }}>Planxo</a>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            ...s.tabBtn, background: tab === t.key ? "#f3f4f6" : "transparent",
            color: tab === t.key ? "#242424" : "#898989", fontWeight: tab === t.key ? 600 : 400,
          }}>{t.icon} {t.label}</button>
        ))}
        <div style={{marginTop:"auto",paddingTop:20,borderTop:"1px solid rgba(0,0,0,0.04)"}}>
          <a href="/dashboard" style={{fontSize:13,color:"#898989",textDecoration:"none"}}>← Tableau de bord</a>
        </div>
      </div>
      <div style={s.content}>
        {tab === "profile" && <ProfileSection user={user} />}
        {tab === "calendars" && <CalendarsSection />}
        {tab === "conferencing" && <ConferencingSection />}
        {tab === "api" && <APISection eventTypes={eventTypes} />}
        {tab === "appearance" && <AppearanceSection />}
      </div>
    </div>
  );
}

function ProfileSection({ user }: any) {
  return (
    <div>
      <h1 style={s.h1}>Profil</h1>
      <p style={s.desc}>Gérez vos informations personnelles.</p>
      <div style={s.card}>
        <div style={{display:"grid",gap:16}}>
          <Field label="Nom complet" defaultValue={user?.name} />
          <Field label="Nom d'utilisateur" defaultValue={user?.username} />
          <Field label="Courriel" defaultValue={user?.email} type="email" />
          <div>
            <label style={s.label}>Fuseau horaire</label>
            <select defaultValue={user?.timeZone || "America/Toronto"} style={s.input}>
              <option>America/Toronto</option><option>America/New_York</option><option>America/Vancouver</option><option>America/Chicago</option><option>Europe/Paris</option><option>Europe/London</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarsSection() {
  return (
    <div>
      <h1 style={s.h1}>Calendriers connectés</h1>
      <p style={s.desc}>Connectez vos calendriers Google et Outlook pour synchroniser vos disponibilités.</p>
      <div style={s.card}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <a href="/api/auth/google" style={s.calBtn}>🔵 Connecter Google Calendar</a>
          <a href="/api/auth/outlook" style={{...s.calBtn,background:"#0078D4",color:"#fff",border:"none"}}>🔷 Connecter Outlook Calendar</a>
        </div>
        <div style={{marginTop:16,fontSize:12,color:"#92400e",background:"#fef3c7",padding:"10px 14px",borderRadius:8,border:"1px solid #fde68a"}}>
          Configurez GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET et OUTLOOK_CLIENT_ID + OUTLOOK_CLIENT_SECRET dans Vercel pour activer.
        </div>
      </div>
    </div>
  );
}

function ConferencingSection() {
  return (
    <div>
      <h1 style={s.h1}>Visioconférence</h1>
      <p style={s.desc}>Configurez votre plateforme de visioconférence par défaut.</p>
      <div style={s.card}>
        {["Google Meet", "Zoom", "Microsoft Teams", "Téléphone"].map(opt => (
          <label key={opt} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:"1px solid rgba(0,0,0,0.04)",cursor:"pointer",fontSize:14}}>
            <input type="radio" name="conferencing" defaultChecked={opt === "Google Meet"} style={{accentColor:"#242424"}} />
            {opt === "Google Meet" ? "📹" : opt === "Zoom" ? "🎥" : opt === "Microsoft Teams" ? "💜" : "📞"} {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

function APISection({ eventTypes }: any) {
  return (
    <div>
      <h1 style={s.h1}>API & Développeurs</h1>
      <p style={s.desc}>API v2 compatible Cal.com. Gérez vos clés et webhooks.</p>
      <div style={{...s.card,marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Clé API</h3>
        <code style={{display:"block",background:"#f9fafb",padding:12,borderRadius:8,fontSize:12,fontFamily:"monospace",marginBottom:12}}>
          cal_live_planxo_demo_key
        </code>
        <p style={{fontSize:13,color:"#898989"}}>Utilisez l'en-tête <code>Authorization: Bearer votre_clé</code></p>
        <a href="https://cal.com/docs/api-reference/v2/introduction" target="_blank" style={{fontSize:13,color:"#0099ff",display:"inline-block",marginTop:8}}>Documentation API →</a>
      </div>
      <div style={s.card}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Types de rendez-vous</h3>
        {eventTypes.map((et: any) => (
          <div key={et.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,0.04)"}}>
            <div>
              <span style={{fontSize:14,fontWeight:500}}>{et.title}</span>
              <span style={{fontSize:12,color:"#898989",marginLeft:8}}>/{et.slug}</span>
            </div>
            <a href={`/${et.slug}`} style={{fontSize:12,color:"#0099ff",textDecoration:"none"}}>Lien →</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div>
      <h1 style={s.h1}>Apparence</h1>
      <p style={s.desc}>Personnalisez l'apparence de votre page de réservation.</p>
      <div style={s.card}>
        <div style={{display:"grid",gap:16}}>
          <div>
            <label style={s.label}>Couleur du bouton</label>
            <div style={{display:"flex",gap:8}}>
              {["#242424","#3b82f6","#10b981","#ef4444","#8b5cf6"].map(c => (
                <div key={c} style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:c==="#242424"?"2px solid #242424":"2px solid transparent"}} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} defaultValue={defaultValue} style={s.input} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif",color:"#242424",background:"#fff",position:"relative",zIndex:1,flexWrap:"wrap" },
  sidebar: { width: 220, padding: "20px 16px", borderRight: "1px solid rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", flexShrink: 0 },
  tabBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left", marginBottom: 2, transition: "all .15s" },
  content: { flex: 1, padding: "24px 16px 80px", maxWidth: 960 },
  h1: { fontFamily: "'Cal Sans',sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 6 },
  desc: { fontSize: 14, color: "#898989", marginBottom: 28 },
  card: { padding: 24, borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" },
  label: { fontSize: 12, fontWeight: 500, color: "#898989", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, fontFamily: "'Inter',sans-serif", outline: "none", boxSizing: "border-box" },
  calBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 9999, fontSize: 14, fontWeight: 600, textDecoration: "none", background: "#fff", color: "#242424", border: "1px solid rgba(0,0,0,0.12)", width: "fit-content" },
};
