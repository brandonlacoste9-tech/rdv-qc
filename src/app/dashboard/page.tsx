"use client";

import { useState, useEffect } from "react";

interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string;
  length: number;
  location: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  eventType: { title: string; slug: string };
}

export default function DashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newET, setNewET] = useState({ title: "", slug: "", length: 30, location: "google-meet", description: "" });
  const [copySuccess, setCopySuccess] = useState("");

  useEffect(() => {
    fetch("/api/v2/me")
      .then((r) => r.json())
      .then((user) => {
        setEventTypes(user.eventTypes || []);
      });
    fetch("/api/v2/bookings")
      .then((r) => r.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  async function createEventType(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v2/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newET),
    });
    if (res.ok) {
      const created = await res.json();
      setEventTypes([...eventTypes, created]);
      setShowNew(false);
      setNewET({ title: "", slug: "", length: 30, location: "google-meet", description: "" });
    }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(slug);
    setTimeout(() => setCopySuccess(""), 2000);
  }

  if (loading) {
    return <div style={styles.container}><p style={styles.muted}>Chargement...</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Planxo</h1>
          <p style={styles.muted}>Tableau de bord</p>
        </div>
        <a href="/" style={styles.backLink}>← Retour au site</a>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{eventTypes.length}</div>
          <div style={styles.statLabel}>Types de rendez-vous</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{bookings.length}</div>
          <div style={styles.statLabel}>Rendez-vous</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {bookings.filter((b) => b.status === "confirmed").length}
          </div>
          <div style={styles.statLabel}>Confirmés</div>
        </div>
      </div>

      {/* Event Types */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.h2}>Types de rendez-vous</h2>
          <button style={styles.primaryBtn} onClick={() => setShowNew(!showNew)}>
            {showNew ? "Annuler" : "+ Nouveau"}
          </button>
        </div>

        {showNew && (
          <form onSubmit={createEventType} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Titre (ex: Consultation 30min)"
              value={newET.title}
              onChange={(e) => {
                const title = e.target.value;
                setNewET({
                  ...newET,
                  title,
                  slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                });
              }}
              required
            />
            <div style={styles.formRow}>
              <select style={styles.select} value={newET.length} onChange={(e) => setNewET({ ...newET, length: Number(e.target.value) })}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
              <select style={styles.select} value={newET.location} onChange={(e) => setNewET({ ...newET, location: e.target.value })}>
                <option value="google-meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="phone">Téléphone</option>
                <option value="in-person">En personne</option>
              </select>
            </div>
            <input
              style={styles.input}
              placeholder="Description (optionnel)"
              value={newET.description}
              onChange={(e) => setNewET({ ...newET, description: e.target.value })}
            />
            <button type="submit" style={styles.primaryBtn}>Créer</button>
          </form>
        )}

        <div style={styles.eventGrid}>
          {eventTypes.map((et) => (
            <div key={et.id} style={styles.eventCard}>
              <div>
                <h3 style={styles.h3}>{et.title}</h3>
                <p style={styles.muted}>{et.length} min · {et.location === "google-meet" ? "Google Meet" : et.location === "phone" ? "Téléphone" : et.location === "zoom" ? "Zoom" : "En personne"}</p>
              </div>
              <button
                style={copySuccess === et.slug ? styles.copiedBtn : styles.copyBtn}
                onClick={() => copyLink(et.slug)}
              >
                {copySuccess === et.slug ? "✓ Copié!" : "Copier le lien"}
              </button>
            </div>
          ))}
          {eventTypes.length === 0 && (
            <p style={styles.muted}>Aucun type de rendez-vous. Créez votre premier!</p>
          )}
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div style={styles.section}>
        <h2 style={styles.h2}>Rendez-vous à venir</h2>
        <div style={styles.bookingList}>
          {bookings.filter((b) => b.status !== "cancelled").map((b) => (
            <div key={b.id} style={styles.bookingCard}>
              <div style={styles.bookingLeft}>
                <div style={styles.avatar}>{b.guestName[0]}</div>
                <div>
                  <div style={styles.guestName}>{b.guestName}</div>
                  <div style={styles.muted}>{b.guestEmail}</div>
                </div>
              </div>
              <div style={styles.bookingRight}>
                <div style={styles.bookingType}>{b.eventType.title}</div>
                <div style={styles.bookingTime}>
                  {new Date(b.startTime).toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}
                  {new Date(b.startTime).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span style={{
                ...styles.badge,
                background: b.status === "confirmed" ? "#ecfdf5" : "#fef2f2",
                color: b.status === "confirmed" ? "#059669" : "#dc2626",
              }}>
                {b.status === "confirmed" ? "Confirmé" : b.status}
              </span>
            </div>
          ))}
          {bookings.filter((b) => b.status !== "cancelled").length === 0 && (
            <p style={styles.muted}>Aucun rendez-vous à venir.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#242424",
    background: "#fff",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
  },
  h1: {
    fontFamily: "'Cal Sans', 'Inter', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: "#242424",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  h2: {
    fontFamily: "'Cal Sans', 'Inter', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: "#242424",
    margin: "0 0 16px",
  },
  h3: {
    fontFamily: "'Cal Sans', 'Inter', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: "#242424",
    margin: 0,
  },
  muted: { fontSize: 14, color: "#898989", margin: "4px 0 0" },
  backLink: { color: "#898989", textDecoration: "none", fontSize: 14, fontWeight: 500 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 },
  statCard: {
    padding: 24,
    borderRadius: 12,
    background: "#f9fafb",
    textAlign: "center" as const,
  },
  statNumber: { fontSize: 36, fontWeight: 700, color: "#242424", fontFamily: "'Cal Sans', sans-serif" },
  statLabel: { fontSize: 13, color: "#898989", marginTop: 4, fontWeight: 500 },
  section: { marginBottom: 48 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  primaryBtn: {
    background: "#242424",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  eventGrid: { display: "flex", flexDirection: "column" as const, gap: 8 },
  eventCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
  },
  copyBtn: {
    background: "#f9fafb",
    color: "#242424",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: "1px solid rgba(0,0,0,0.08)",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  copiedBtn: {
    background: "#ecfdf5",
    color: "#059669",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #a7f3d0",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  form: {
    background: "#f9fafb",
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  input: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  select: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.1)",
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    flex: 1,
  },
  formRow: { display: "flex", gap: 12 },
  bookingList: { display: "flex", flexDirection: "column" as const, gap: 8 },
  bookingCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
  },
  bookingLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#6b7280", flexShrink: 0,
  },
  guestName: { fontSize: 14, fontWeight: 600, color: "#242424" },
  bookingRight: { textAlign: "right" as const },
  bookingType: { fontSize: 13, fontWeight: 500, color: "#242424" },
  bookingTime: { fontSize: 13, color: "#898989", marginTop: 2 },
  badge: {
    padding: "4px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, flexShrink: 0,
  },
};
