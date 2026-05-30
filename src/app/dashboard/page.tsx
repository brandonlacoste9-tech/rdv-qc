"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTheme } from "@/lib/theme";
import { Calendar, Users, CheckCircle, AlertCircle, ArrowRight, Copy, ExternalLink, X } from "lucide-react";

interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string;
  length: number;
  location: string;
  isActive: boolean;
  color?: string;
}

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestNotes?: string;
  startTime: string;
  endTime: string;
  status: string;
  eventTypeId?: string;
  eventType: { title: string; slug: string };
}

export default function DashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userSlug, setUserSlug] = useState("");
  const [copySuccess, setCopySuccess] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { colors } = useTheme();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, bookingsRes] = await Promise.all([
        fetch("/api/v2/me"),
        fetch("/api/v2/bookings?timeFilter=upcoming"),
      ]);
      const user = await userRes.json();
      
      if (!user.username) {
        // Auto-onboard if username is missing
        await fetch("/api/v2/onboarding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        // Re-fetch data after auto-onboarding
        fetchData();
        return;
      }
      
      const bookingsData = await bookingsRes.json();

      if (user.username) setUserSlug(user.username);
      if (user.name) setUserName(user.name);
      setEventTypes(user.eventTypes || []);
      setBookings(bookingsData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upcomingBookings = bookings.filter(b => b.status === "confirmed").slice(0, 5);
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;

  const copyLink = (slug: string) => {
    const url = userSlug ? `${window.location.origin}/${userSlug}/${slug}` : `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(slug);
    setTimeout(() => setCopySuccess(""), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: colors.textMuted }}>
          Chargement...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: colors.text, margin: 0 }}>
            Bonjour {userName || "Utilisateur"}
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: "8px 0 0" }}>
            Voici un aperçu de votre activité de planification
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {/* Event Types Card */}
          <a
            href="/event-types"
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.border;
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
                Types de rendez-vous
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: colors.accent, marginTop: 12 }}>
                {eventTypes.length}
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0 0" }}>
                Gérer les types de rendez-vous
              </p>
            </div>
            <div style={{ width: 48, height: 48, background: `${colors.accent}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={24} color={colors.accent} />
            </div>
          </a>

          {/* Bookings Card */}
          <a
            href="/bookings"
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              textDecoration: "none",
              color: "inherit",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.border;
              (e.currentTarget as HTMLElement).style.transform = "none";
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
                Total des réservations
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: colors.accent, marginTop: 12 }}>
                {bookings.length}
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0 0" }}>
                Voir toutes les réservations
              </p>
            </div>
            <div style={{ width: 48, height: 48, background: `${colors.accent}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color={colors.accent} />
            </div>
          </a>

          {/* Confirmed Card */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
                Confirmés
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: colors.accent, marginTop: 12 }}>
                {confirmedCount}
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0 0" }}>
                Rendez-vous confirmés
              </p>
            </div>
            <div style={{ width: 48, height: 48, background: `${colors.accent}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={24} color={colors.accent} />
            </div>
          </div>
        </div>

        {/* Active Meeting Types Section */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0 }}>
              Vos types de rendez-vous
            </h2>
            <a
              href="/event-types"
              style={{
                fontSize: 13,
                color: colors.accent,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Tout gérer <ArrowRight size={14} />
            </a>
          </div>

          {eventTypes.length === 0 ? (
            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              <AlertCircle size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p>Aucun type de rendez-vous créé pour le moment</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {eventTypes.map((et) => (
                <div
                  key={et.id}
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: et.color || colors.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.accentText,
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {et.title[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: colors.text, fontSize: 15, marginBottom: 4 }}>
                        {et.title}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted }}>
                        {et.length} min • /{et.slug}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button
                      onClick={() => copyLink(et.slug)}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px",
                        background: "transparent",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        color: colors.textMuted,
                        cursor: "pointer",
                        fontSize: 12,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                        (e.currentTarget as HTMLElement).style.color = colors.accent;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                        (e.currentTarget as HTMLElement).style.color = colors.textMuted;
                      }}
                    >
                      <Copy size={14} />
                      {copySuccess === et.slug ? "Copié !" : "Copier le lien"}
                    </button>
                    <a
                      href={userSlug ? `/${userSlug}/${et.slug}` : `/${et.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px",
                        background: "transparent",
                        border: `1px solid ${colors.border}`,
                        borderRadius: 8,
                        color: colors.textMuted,
                        cursor: "pointer",
                        fontSize: 12,
                        textDecoration: "none",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                        (e.currentTarget as HTMLElement).style.color = colors.accent;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                        (e.currentTarget as HTMLElement).style.color = colors.textMuted;
                      }}
                    >
                      <ExternalLink size={14} />
                      Aperçu
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: 0 }}>
              Réservations à venir
            </h2>
            <a
              href="/bookings"
              style={{
                fontSize: 13,
                color: colors.accent,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Voir tout <ArrowRight size={14} />
            </a>
          </div>

          {upcomingBookings.length === 0 ? (
            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
                color: colors.textMuted,
              }}
            >
              <AlertCircle size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p>Aucune réservation à venir</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text }}>
                      {booking.guestName}
                    </div>
                    <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                      {booking.eventType?.title} • {new Date(booking.startTime).toLocaleDateString("fr-CA")} à{" "}
                      {new Date(booking.startTime).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: colors.accent,
                        color: colors.accentText,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: "0 0 16px" }}>
            Actions rapides
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <a
              href="/event-types"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: colors.text,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                (e.currentTarget as HTMLElement).style.background = `${colors.accent}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                (e.currentTarget as HTMLElement).style.background = colors.cardBg;
              }}
            >
              <Calendar size={20} color={colors.accent} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Créer un type de rendez-vous</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Ajouter un nouveau type de planification
                </div>
              </div>
            </a>

            <a
              href="/availability"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: colors.text,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                (e.currentTarget as HTMLElement).style.background = `${colors.accent}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                (e.currentTarget as HTMLElement).style.background = colors.cardBg;
              }}
            >
              <AlertCircle size={20} color={colors.accent} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Définir vos disponibilités</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Configurez vos heures de travail
                </div>
              </div>
            </a>

            <a
              href="/dashboard/voice"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: colors.text,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                (e.currentTarget as HTMLElement).style.background = `${colors.accent}10`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                (e.currentTarget as HTMLElement).style.background = colors.cardBg;
              }}
            >
              <Calendar size={20} color={colors.accent} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Assistant IA</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Réservez avec l'IA vocale ou textuelle
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(26,16,8,0.72)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setSelectedBooking(null)}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: "90%",
                zIndex: 51,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>
                  Détails de la réservation
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.textMuted,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Invité</div>
                  <div style={{ fontSize: 16, color: colors.text, fontWeight: 500 }}>{selectedBooking.guestName}</div>
                  <div style={{ fontSize: 14, color: colors.accent, marginTop: 2 }}>{selectedBooking.guestEmail}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Rendez-vous</div>
                  <div style={{ fontSize: 16, color: colors.text }}>{selectedBooking.eventType?.title || "Rendez-vous"}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Heure</div>
                  <div style={{ fontSize: 16, color: colors.text }}>
                    {new Date(selectedBooking.startTime).toLocaleDateString("fr-CA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <br />
                    {new Date(selectedBooking.startTime).toLocaleTimeString("fr-CA", { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedBooking.endTime).toLocaleTimeString("fr-CA", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {selectedBooking.guestNotes && (
                  <div>
                    <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 14, color: colors.text, background: `${colors.accent}10`, padding: 12, borderRadius: 8 }}>
                      {selectedBooking.guestNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
