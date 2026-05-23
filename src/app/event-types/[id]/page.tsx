"use client";

import { useState, useEffect, use } from "react";

interface EventTypeForm {
  title: string;
  description: string;
  length: number;
  location: string;
  price: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  minimumBookingNotice: number;
  requiresConfirmation: boolean;
  isActive: boolean;
}

const C = {
  bg: "#1a1208",
  surface: "#231810",
  card: "#2a1f12",
  border: "rgba(200,169,110,0.18)",
  borderFocus: "rgba(200,169,110,0.55)",
  accent: "#c8a96e",
  accentHover: "#d4b87e",
  text: "#f5e6c8",
  textMuted: "rgba(245,230,200,0.55)",
  textDim: "rgba(245,230,200,0.35)",
  success: "#4ade80",
  successBg: "rgba(74,222,128,0.1)",
  successBorder: "rgba(74,222,128,0.25)",
  error: "#f87171",
  errorBg: "rgba(248,113,113,0.1)",
};

export default function EventTypeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [form, setForm] = useState<EventTypeForm>({
    title: "",
    description: "",
    length: 30,
    location: "google-meet",
    price: 0,
    beforeEventBuffer: 0,
    afterEventBuffer: 0,
    minimumBookingNotice: 120,
    requiresConfirmation: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v2/event-types/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.status === "success" && res.data) {
          const d = res.data;
          setForm({
            title: d.title || "",
            description: d.description || "",
            length: d.length || 30,
            location: d.location || "google-meet",
            price: typeof d.price === "number" ? d.price : 0,
            beforeEventBuffer: d.beforeEventBuffer ?? d.bufferBefore ?? 0,
            afterEventBuffer: d.afterEventBuffer ?? d.bufferAfter ?? 0,
            minimumBookingNotice: d.minimumBookingNotice ?? 120,
            requiresConfirmation: d.requiresConfirmation ?? false,
            isActive: d.isActive ?? true,
          });
        } else {
          setError("Type de rendez-vous introuvable.");
        }
      })
      .catch(() => setError("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/v2/event-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.error?.message || "Erreur lors de la sauvegarde.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, children: React.ReactNode, hint?: string) {
    return (
      <div style={{ marginBottom: 20 }}>
        <label style={styles.label}>{label}</label>
        {children}
        {hint && <p style={styles.hint}>{hint}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <p style={{ color: C.textMuted, fontSize: 14 }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${C.borderFocus} !important;
          box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
        }
        input[type="checkbox"] {
          width: 18px; height: 18px; cursor: pointer; accent-color: ${C.accent};
        }
        .save-btn:hover:not(:disabled) { background: ${C.accentHover} !important; transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .back-link:hover { color: ${C.accent} !important; }
        .toggle-row:hover { background: rgba(200,169,110,0.05) !important; }
        select option { background: #231810; color: #f5e6c8; }
      `}} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <a href="/dashboard" className="back-link" style={styles.backLink}>
            ← Tableau de bord
          </a>
          <h1 style={styles.title}>Paramètres avancés</h1>
          <p style={styles.subtitle}>Configurer le type de rendez-vous</p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ ...styles.banner, background: C.errorBg, border: `1px solid ${C.error}33`, color: C.error }}>
            {error}
          </div>
        )}

        {/* Success banner */}
        {saved && (
          <div style={{ ...styles.banner, background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success }}>
            ✓ Modifications sauvegardées
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Section: Base */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Informations générales</h2>

            {field("Titre", (
              <input
                style={styles.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Consultation 30 min"
                required
              />
            ))}

            {field("Description", (
              <textarea
                style={{ ...styles.input, minHeight: 80, resize: "vertical" } as React.CSSProperties}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrivez ce type de rendez-vous..."
              />
            ))}

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                {field("Durée", (
                  <select
                    style={styles.select}
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: Number(e.target.value) })}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                {field("Lieu", (
                  <select
                    style={styles.select}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  >
                    <option value="google-meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="phone">Téléphone</option>
                    <option value="in-person">En personne</option>
                  </select>
                ))}
              </div>
            </div>

            {field("Prix (CAD $)", (
              <input
                style={styles.input}
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            ), "Entrez 0 pour un rendez-vous gratuit.")}
          </div>

          {/* Section: Buffers */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Tampons & Délais</h2>
            <p style={styles.sectionDesc}>
              Les tampons ajoutent du temps avant ou après votre rendez-vous pour vous préparer ou faire une transition.
            </p>

            <div style={styles.row}>
              <div style={{ flex: 1 }}>
                {field("Tampon avant", (
                  <select
                    style={styles.select}
                    value={form.beforeEventBuffer}
                    onChange={(e) => setForm({ ...form, beforeEventBuffer: Number(e.target.value) })}
                  >
                    <option value={0}>Aucun</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                ), "Temps de préparation avant le rendez-vous.")}
              </div>
              <div style={{ flex: 1 }}>
                {field("Tampon après", (
                  <select
                    style={styles.select}
                    value={form.afterEventBuffer}
                    onChange={(e) => setForm({ ...form, afterEventBuffer: Number(e.target.value) })}
                  >
                    <option value={0}>Aucun</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                ), "Temps de récupération après le rendez-vous.")}
              </div>
            </div>

            {field("Délai minimum de réservation", (
              <select
                style={styles.select}
                value={form.minimumBookingNotice}
                onChange={(e) => setForm({ ...form, minimumBookingNotice: Number(e.target.value) })}
              >
                <option value={0}>Aucun</option>
                <option value={60}>1 heure</option>
                <option value={120}>2 heures</option>
                <option value={240}>4 heures</option>
                <option value={1440}>24 heures</option>
                <option value={2880}>48 heures</option>
              </select>
            ), "Les créneaux dans ce délai ne seront pas proposés aux clients.")}
          </div>

          {/* Section: Options */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Options</h2>

            {/* requiresConfirmation toggle */}
            <div
              className="toggle-row"
              style={styles.toggleRow}
              onClick={() => setForm({ ...form, requiresConfirmation: !form.requiresConfirmation })}
            >
              <div style={{ flex: 1 }}>
                <div style={styles.toggleLabel}>Nécessite confirmation manuelle</div>
                <div style={styles.toggleDesc}>
                  Les réservations sont en attente jusqu&apos;à votre confirmation explicite.
                </div>
              </div>
              <div style={{
                ...styles.toggleSwitch,
                background: form.requiresConfirmation ? C.accent : "rgba(200,169,110,0.15)",
              }}>
                <div style={{
                  ...styles.toggleThumb,
                  transform: form.requiresConfirmation ? "translateX(22px)" : "translateX(2px)",
                }} />
              </div>
            </div>

            {/* isActive toggle */}
            <div
              className="toggle-row"
              style={{ ...styles.toggleRow, marginTop: 12 }}
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
            >
              <div style={{ flex: 1 }}>
                <div style={styles.toggleLabel}>Type de rendez-vous actif</div>
                <div style={styles.toggleDesc}>
                  Désactivez pour masquer ce type de rendez-vous de votre page publique.
                </div>
              </div>
              <div style={{
                ...styles.toggleSwitch,
                background: form.isActive ? C.accent : "rgba(200,169,110,0.15)",
              }}>
                <div style={{
                  ...styles.toggleThumb,
                  transform: form.isActive ? "translateX(22px)" : "translateX(2px)",
                }} />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div style={styles.footer}>
            <a href="/dashboard" style={styles.cancelLink}>Annuler</a>
            <button
              type="submit"
              className="save-btn"
              disabled={saving}
              style={styles.saveBtn}
            >
              {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé" : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: C.text,
    paddingBottom: 80,
  },
  container: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "32px 20px",
  },
  header: {
    marginBottom: 36,
  },
  backLink: {
    color: C.textMuted,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-block",
    marginBottom: 20,
    transition: "color 0.15s",
  },
  title: {
    fontFamily: "'Cal Sans', 'Inter', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    color: C.text,
    margin: "0 0 6px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    margin: 0,
  },
  banner: {
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 24,
  },
  section: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: "24px 24px 8px",
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'Cal Sans', 'Inter', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: C.accent,
    margin: "0 0 4px",
    letterSpacing: "0.2px",
  },
  sectionDesc: {
    fontSize: 13,
    color: C.textMuted,
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: C.textMuted,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  hint: {
    fontSize: 12,
    color: C.textDim,
    margin: "5px 0 0",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    appearance: "auto" as const,
  },
  row: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "14px 16px",
    borderRadius: 10,
    cursor: "pointer",
    border: `1px solid ${C.border}`,
    marginBottom: 4,
    transition: "background 0.12s",
    userSelect: "none" as const,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: C.text,
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 1.4,
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    position: "relative" as const,
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute" as const,
    top: 3,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  cancelLink: {
    color: C.textMuted,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
  },
  saveBtn: {
    background: C.accent,
    color: "#1a1208",
    padding: "11px 28px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    transition: "background 0.15s, transform 0.1s",
    letterSpacing: "0.2px",
  },
};
