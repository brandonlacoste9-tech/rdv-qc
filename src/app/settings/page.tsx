"use client";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/me")
      .then(r => r.json())
      .then(data => { setUser(data); setEventTypes(data.eventTypes || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.container}><p style={s.muted}>Chargement...</p></div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <a href="/" style={{ fontFamily: "'Cal Sans', sans-serif", fontSize: 22, fontWeight: 700, color: "#242424", textDecoration: "none", letterSpacing: "-0.5px" }}>Planxo</a>
          <div style={s.muted}>Paramètres</div>
        </div>
        <a href="/dashboard" style={{ color: "#898989", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>← Tableau de bord</a>
      </div>

      {/* Profile */}
      <section style={s.card}>
        <h2 style={s.h2}>👤 Profil</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div><label style={s.label}>Nom</label><input defaultValue={user?.name} style={s.input} /></div>
          <div><label style={s.label}>Nom d'utilisateur</label><input defaultValue={user?.username} style={s.input} /></div>
          <div><label style={s.label}>Courriel</label><input defaultValue={user?.email} style={s.input} /></div>
          <div><label style={s.label}>Fuseau horaire</label>
            <select defaultValue={user?.timeZone || "America/Toronto"} style={s.input}>
              <option>America/Toronto</option><option>America/New_York</option><option>America/Vancouver</option><option>Europe/Paris</option>
            </select></div>
        </div>
      </section>

      {/* Calendars */}
      <section style={s.card}>
        <h2 style={s.h2}>📅 Calendriers connectés</h2>
        <p style={{ fontSize: 14, color: "#898989", marginBottom: 16 }}>Connectez Google Calendar ou Outlook pour synchroniser vos disponibilités en temps réel.</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <a href="/api/auth/google" style={s.calBtn}>🔵 Connecter Google Calendar</a>
          <a href="/api/auth/outlook" style={{ ...s.calBtn, background: "#0078D4", color: "#fff", border: "none" }}>🔷 Connecter Outlook</a>
        </div>
        <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", padding: "10px 14px", borderRadius: 8, border: "1px solid #fde68a" }}>
          ⚠️ Configurez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Vercel pour activer l'authentification OAuth.
        </div>
      </section>

      {/* Event Types */}
      <section style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ ...s.h2, marginBottom: 0 }}>📋 Types de rendez-vous</h2>
          <a href="/dashboard" style={{ fontSize: 13, color: "#242424", fontWeight: 500, textDecoration: "none", padding: "6px 14px", borderRadius: 9999, border: "1px solid rgba(0,0,0,0.1)" }}>Gérer</a>
        </div>
        {eventTypes.map((et: any) => (
          <div key={et.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{et.title}</div>
              <div style={{ fontSize: 12, color: "#898989" }}>{et.length} min · {et.location} · /{et.slug}</div>
            </div>
            <a href={`/${et.slug}`} style={{ fontSize: 13, color: "#0099ff", textDecoration: "none" }}>Lien →</a>
          </div>
        ))}
      </section>

      {/* API */}
      <section style={s.card}>
        <h2 style={s.h2}>🔑 API</h2>
        <p style={{ fontSize: 14, color: "#898989", marginBottom: 12 }}>API v2 compatible Cal.com. Utilisez l'en-tête Authorization: Bearer.</p>
        <code style={{ display: "block", background: "#f9fafb", padding: 12, borderRadius: 8, fontSize: 12, fontFamily: "monospace", marginBottom: 12 }}>
          curl https://rdv-qc.vercel.app/api/v2/me
        </code>
        <a href="https://cal.com/docs/api-reference/v2/introduction" target="_blank" style={{ fontSize: 13, color: "#0099ff" }}>Documentation API →</a>
      </section>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { fontFamily: "'Inter', system-ui, sans-serif", color: "#242424", maxWidth: 720, margin: "0 auto", padding: "40px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  h2: { fontFamily: "'Cal Sans', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 },
  muted: { fontSize: 13, color: "#898989", marginTop: 4 },
  card: { marginBottom: 28, padding: 28, borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", background: "#fff" },
  label: { fontSize: 12, fontWeight: 500, color: "#898989", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" },
  calBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 9999, fontSize: 14, fontWeight: 600, textDecoration: "none", background: "#fff", color: "#242424", border: "1px solid rgba(0,0,0,0.12)", cursor: "pointer" },
};
