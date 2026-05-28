"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTheme } from "@/lib/theme";

type Booking = {
  id: string;
  uid: string;
  start: string;
  end: string;
  title: string;
  status: string;
  attendees: Array<{ name: string; email: string }>;
  meetingUrl?: string;
  paid?: boolean;
};

export default function BookingsPage() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [meRes, bookingsRes] = await Promise.all([
          fetch("/api/v2/me"),
          fetch("/api/v2/bookings?timeFilter=upcoming"),
        ]);

        if (!meRes.ok) {
          throw new Error("Failed to load current user");
        }

        if (!bookingsRes.ok) {
          throw new Error("Failed to load bookings");
        }

        const bookingsJson = await bookingsRes.json();
        if (!mounted) return;

        setBookings(Array.isArray(bookingsJson?.data) ? bookingsJson.data : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Unable to load bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: colors.text, margin: 0 }}>
            Bookings
          </h1>
          <p style={{ marginTop: 8, color: colors.textMuted, fontSize: 14 }}>
            View and track your upcoming appointments.
          </p>
        </div>

        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 24, color: colors.textMuted }}>Loading bookings...</div>
          ) : error ? (
            <div style={{ padding: 24, color: colors.accentHover }}>{error}</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: 24, color: colors.textMuted }}>
              No upcoming bookings yet.
            </div>
          ) : (
            bookings.map((booking) => {
              const attendee = booking.attendees?.[0];
              return (
                <div
                  key={booking.id}
                  style={{
                    padding: 20,
                    borderBottom: `1px solid ${colors.border}`,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                      {booking.title || "Booking"}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>
                      {new Date(booking.start).toLocaleString()} - {new Date(booking.end).toLocaleTimeString()}
                    </div>
                    <div style={{ color: colors.textMuted, fontSize: 13 }}>
                      {attendee?.name || "Guest"}
                      {attendee?.email ? ` (${attendee.email})` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: booking.status === "accepted" ? `${colors.accent}20` : `${colors.border}`,
                        color: booking.status === "accepted" ? colors.accent : colors.textMuted,
                      }}
                    >
                      {booking.status}
                    </div>
                    {booking.meetingUrl ? (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={booking.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: colors.accent, fontSize: 12, textDecoration: "none" }}
                        >
                          Join meeting
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
