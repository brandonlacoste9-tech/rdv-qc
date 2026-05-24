"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme";

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
  eventTypeId?: string;
  eventType: { title: string; slug: string };
}

type FilterValue = "upcoming" | "past" | "cancelled";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
  { value: "cancelled", label: "Annulés" },
];

export default function DashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userSlug, setUserSlug] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newET, setNewET] = useState({ title: "", slug: "", length: 30, location: "google-meet", description: "" });
  const [copySuccess, setCopySuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("upcoming");
  const { colors, setTheme, theme } = useTheme();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, bookingsRes] = await Promise.all([
        fetch("/api/v2/me"),
        fetch("/api/v2/bookings?timeFilter=upcoming")
      ]);
      
      const user = await userRes.json();
      const bookingsData = await bookingsRes.json();

      if (user.username) setUserSlug(user.username);
      if (user.name) setUserName(user.name);
      setEventTypes(user.eventTypes || []);
      setBookings(bookingsData.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    await fetch(`/api/v2/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Annulé par l'hôte" }),
    });
    fetchData();
  };

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
    const url = `${window.location.origin}/${userSlug}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(slug);
    setTimeout(() => setCopySuccess(""), 2000);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, padding: "40px 60px" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
        <div>
          <div style={{ fontFamily: "'Cal Sans', 'Inter', sans-serif", fontSize: 28, fontWeight: 700 }}>
            Planxo
          </div>
          <div style={{ color: colors.textMuted, fontSize: 14 }}>Tableau de bord</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button 
            onClick={() => setTheme(theme === "cognac" ? "default" : "cognac")}
            style={{ 
              background: colors.cardBg, 
              border: `1px solid ${colors.border}`, 
              color: colors.text, 
              padding: "8px 16px", 
              borderRadius: 8, 
              cursor: "pointer",
              fontSize: 13
            }}
          >
            Changer le thème
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 48 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Cal Sans', sans-serif" }}>{eventTypes.length}</div>
          <div style={{ color: colors.textMuted, marginTop: 4, fontSize: 14 }}>Types de rendez-vous</div>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Cal Sans', sans-serif" }}>{bookings.length}</div>
          <div style={{ color: colors.textMuted, marginTop: 4, fontSize: 14 }}>Rendez-vous</div>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Cal Sans', sans-serif" }}>
            {bookings.filter(b => b.status === "confirmed").length}
          </div>
          <div style={{ color: colors.textMuted, marginTop: 4, fontSize: 14 }}>Confirmés</div>
        </div>
      </div>

      {/* Event Types */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: colors.text }}>Types de rendez-vous</h2>
          <button 
            onClick={() => setShowNew(!showNew)}
            style={{ 
              background: colors.accent, 
              color: "#1a1008", 
              border: "none", 
              padding: "10px 20px", 
              borderRadius: 10, 
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {showNew ? "Annuler" : "+ Nouveau"}
          </button>
        </div>

        {showNew && (
          <form onSubmit={createEventType} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, padding: 24, borderRadius: 16, marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <input placeholder="Titre" value={newET.title} onChange={e => setNewET({...newET, title: e.target.value})} required style={{ padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }} />
              <input placeholder="Slug" value={newET.slug} onChange={e => setNewET({...newET, slug: e.target.value})} required style={{ padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }} />
            </div>
            <button type="submit" style={{ marginTop: 16, background: colors.accent, color: "#1a1008", padding: "12px 24px", borderRadius: 10, border: "none", fontWeight: 600, cursor: "pointer" }}>
              Créer
            </button>
          </form>
        )}

        {eventTypes.length === 0 ? (
          <p style={{ color: colors.textMuted }}>Aucun type de rendez-vous. Créez votre premier !</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {eventTypes.map(et => (
              <div key={et.id} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{et.title}</div>
                  <div style={{ color: colors.textMuted, fontSize: 13 }}>{et.length} min • {et.location}</div>
                </div>
                <button onClick={() => copyLink(et.slug)} style={{ background: colors.accent, color: "#1a1008", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                  {copySuccess === et.slug ? "Copié !" : "Copier le lien"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: colors.text }}>Rendez-vous</h2>
        
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button 
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: activeFilter === f.value ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                background: activeFilter === f.value ? colors.accent : "transparent",
                color: activeFilter === f.value ? "#1a1008" : colors.text,
                cursor: "pointer",
                fontSize: 13
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <p style={{ color: colors.textMuted }}>Aucun rendez-vous.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {bookings.map(b => (
              <div key={b.id} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.guestName}</div>
                  <div style={{ color: colors.textMuted, fontSize: 13 }}>{b.eventType?.title} • {new Date(b.startTime).toLocaleDateString('fr-CA')}</div>
                </div>
                <button onClick={() => handleCancelBooking(b.id)} style={{ color: "#e74c3c", background: "none", border: "none", cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
