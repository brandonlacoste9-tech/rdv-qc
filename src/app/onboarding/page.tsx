"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "America/Toronto", "America/New_York", "America/Vancouver",
  "America/Chicago", "America/Edmonton", "America/Halifax",
  "America/Winnipeg", "Europe/Paris", "Europe/London",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [timeZone, setTimeZone] = useState("America/Toronto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleFinish() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      return;
    }

    // Upsert user record
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, timeZone }),
    });

    if (!res.ok) {
      setError("Erreur lors de la sauvegarde.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif", position: "relative", zIndex: 1,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 480,
        border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
      }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? "#242424" : "#e5e5e5",
              transition: "background .3s",
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={{
              fontFamily: "'Cal Sans', 'Inter', sans-serif", fontSize: 26, fontWeight: 700,
              color: "#242424", marginBottom: 8,
            }}>Bienvenue sur Planxo</h1>
            <p style={{ fontSize: 14, color: "#898989", marginBottom: 28 }}>
              Configurons votre profil en deux étapes.
            </p>

            <label style={labelStyle}>Votre nom</label>
            <input
              style={inputStyle}
              placeholder="Jean Tremblay"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />

            <label style={labelStyle}>Nom d'utilisateur</label>
            <input
              style={inputStyle}
              placeholder="jeantremblay"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            />
            <p style={{ fontSize: 12, color: "#898989", marginTop: -4, marginBottom: 16 }}>
              Votre lien de réservation: planxo.ca/<strong>{username || "..."}</strong>
            </p>

            <button
              onClick={() => { if (name && username) setStep(2); }}
              disabled={!name || !username}
              style={{
                width: "100%", padding: "14px", borderRadius: 10, border: "none",
                background: !name || !username ? "#d1d5db" : "#242424",
                color: "#fff", fontSize: 15, fontWeight: 600, cursor: !name || !username ? "default" : "pointer",
                fontFamily: "'Inter', sans-serif", transition: "all .15s",
              }}
            >
              Continuer
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{
              fontFamily: "'Cal Sans', 'Inter', sans-serif", fontSize: 26, fontWeight: 700,
              color: "#242424", marginBottom: 8,
            }}>Fuseau horaire</h1>
            <p style={{ fontSize: 14, color: "#898989", marginBottom: 28 }}>
              Choisissez votre fuseau horaire pour la planification.
            </p>

            <label style={labelStyle}>Fuseau horaire</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={timeZone}
              onChange={e => setTimeZone(e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace("_", " ").split("/").pop()}</option>
              ))}
            </select>

            {error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: "14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", color: "#242424",
                }}
              >
                Retour
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                style={{
                  flex: 2, padding: "14px", borderRadius: 10, border: "none",
                  background: loading ? "#d1d5db" : "#242424",
                  color: "#fff", fontSize: 15, fontWeight: 600,
                  cursor: loading ? "default" : "pointer",
                  fontFamily: "'Inter', sans-serif", transition: "all .15s",
                }}
              >
                {loading ? "Configuration..." : "Commencer →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#242424", marginBottom: 6, marginTop: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)", fontSize: 15, fontFamily: "'Inter', sans-serif",
  outline: "none", marginBottom: 8, transition: "border-color .15s",
};
