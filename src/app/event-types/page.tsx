"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTheme } from "@/lib/theme";
import { Plus, Edit, Trash2, Copy, ExternalLink, Loader2 } from "lucide-react";

interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string;
  length: number;
  location: string;
  color?: string;
  price?: number;
  currency?: string;
  bufferBefore?: number;
  bufferAfter?: number;
  maxPerDay?: number;
  scheduleId?: string | number;
}

interface Schedule {
  id: string | number;
  name: string;
}

const LOCATIONS = [
  { value: "google-meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "phone", label: "Téléphone" },
  { value: "in-person", label: "En personne" },
];

const COLORS = ["#c47f3a", "#d4944e", "#a86b32", "#8f5a2b", "#e0ad6b", "#7c4d26", "#b07237", "#8c633f"];

function emptyForm() {
  return {
    title: "",
    slug: "",
    description: "",
    length: 30,
    location: "google-meet",
    color: "#c47f3a",
    price: 0,
    currency: "cad",
    bufferBefore: 0,
    bufferAfter: 0,
    maxPerDay: "",
    scheduleId: "",
  };
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: EventType | null }>({ open: false, editing: null });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const { colors } = useTheme();

  const fetchAll = () => {
    fetch("/api/v2/event-types")
      .then((r) => r.json())
      .then((d) => setEventTypes(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    fetch("/api/v2/me")
      .then((r) => r.json())
      .then((d) => {
        setSchedules(d.schedules || []);
        if (d.username) setUsername(d.username);
      });
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setModal({ open: true, editing: null });
  };

  const openEdit = (et: EventType) => {
    setForm({
      title: et.title || "",
      slug: et.slug || "",
      description: et.description || "",
      length: et.length || 30,
      location: et.location || "google-meet",
      color: et.color || "#c47f3a",
      price: et.price || 0,
      currency: et.currency || "cad",
      bufferBefore: et.bufferBefore ?? 0,
      bufferAfter: et.bufferAfter ?? 0,
      maxPerDay: et.maxPerDay?.toString() || "",
      scheduleId: et.scheduleId != null ? String(et.scheduleId) : "",
    });
    setModal({ open: true, editing: et });
  };

  const closeModal = () => setModal({ open: false, editing: null });

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const isEdit = !!modal.editing;
    const url = isEdit ? `/api/v2/event-types/${modal.editing!.id}` : "/api/v2/event-types";
    const method = isEdit ? "PATCH" : "POST";
    const body: any = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      length: form.length,
      location: form.location,
      color: form.color,
      price: form.price,
      currency: form.currency,
      bufferBefore: form.bufferBefore,
      bufferAfter: form.bufferAfter,
      maxPerDay: form.maxPerDay ? parseInt(form.maxPerDay) : null,
      scheduleId: form.scheduleId !== "" ? String(form.scheduleId) : null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      closeModal();
      fetchAll();
    }
  };

  const remove = async (et: EventType) => {
    if (!confirm(`Supprimer « ${et.title} » ?`)) return;
    await fetch(`/api/v2/event-types/${et.id}`, { method: "DELETE" });
    fetchAll();
  };

  const copyLink = (slug: string) => {
    const url = username ? `${window.location.origin}/${username}/${slug}` : `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(slug);
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: colors.textMuted }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: colors.text, margin: 0 }}>Types de rendez-vous</h1>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: "8px 0 0" }}>
              Créez et gérez vos types de planification
            </p>
          </div>
          <button
            onClick={openNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: colors.accent,
              color: colors.accentText,
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            <Plus size={18} />
            Nouveau type de rendez-vous
          </button>
        </div>

        {/* Event Types List */}
        {eventTypes.length === 0 ? (
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
              color: colors.textMuted,
            }}
          >
            <p style={{ fontSize: 14, margin: 0 }}>Aucun type de rendez-vous pour le moment. Créez votre premier pour commencer.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {eventTypes.map((et) => (
              <div
                key={et.id}
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                  (e.currentTarget as HTMLElement).style.background = `${colors.accent}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = colors.border;
                  (e.currentTarget as HTMLElement).style.background = colors.cardBg;
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: et.color || colors.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.accentText,
                      fontWeight: 700,
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {et.title[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: colors.text, fontSize: 15 }}>
                      {et.title}
                    </div>
                    <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                      {et.length} min • {LOCATIONS.find((l) => l.value === et.location)?.label || et.location} • /{et.slug}
                      {(et.price ?? 0) > 0 && ` • ${((et.price ?? 0) / 100).toFixed(2)} ${et.currency?.toUpperCase()}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => copyLink(et.slug)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
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
                    {copySuccess === et.slug ? "Copié !" : "Copier"}
                  </button>

                  <a
                    href={username ? `/${username}/${et.slug}` : `/${et.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
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

                  <button
                    onClick={() => openEdit(et)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
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
                    <Edit size={14} />
                    Modifier
                  </button>

                  <button
                    onClick={() => remove(et)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      background: "transparent",
                      border: `1px solid ${colors.accentHover}`,
                      borderRadius: 8,
                      color: colors.accentHover,
                      cursor: "pointer",
                      fontSize: 12,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${colors.accentHover}20`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal.open && (
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
              onClick={closeModal}
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
                maxWidth: 600,
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto",
                zIndex: 51,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>
                  {modal.editing ? "Modifier le type de rendez-vous" : "Créer un type de rendez-vous"}
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    color: colors.textMuted,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Title */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Titre</span>
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="ex. : Consultation 30 min"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </label>

                {/* Slug */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Identifiant (URL)</span>
                  <input
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="ex. : consultation-30min"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </label>

                {/* Schedule */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Horaire personnalisé</span>
                  <select
                    value={form.scheduleId || ""}
                    onChange={(e) => set("scheduleId", e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      outline: "none",
                    }}
                  >
                    <option value="">Utiliser les disponibilités par défaut</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Description */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Décrivez ce type de rendez-vous..."
                    rows={3}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: colors.bg,
                      color: colors.text,
                      fontSize: 14,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {/* Length */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Durée (min)</span>
                    <select
                      value={form.length}
                      onChange={(e) => set("length", parseInt(e.target.value))}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: 14,
                        outline: "none",
                      }}
                    >
                      {[15, 30, 45, 60, 90, 120].map((v) => (
                        <option key={v} value={v}>
                          {v} min
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Location */}
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Lieu</span>
                    <select
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: 14,
                        outline: "none",
                      }}
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Color */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Couleur</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => set("color", c)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: c,
                          border: form.color === c ? `3px solid ${colors.accent}` : "3px solid transparent",
                          cursor: "pointer",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                      />
                    ))}
                  </div>
                </label>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${colors.border}` }}>
                  <button
                    onClick={closeModal}
                    style={{
                      padding: "10px 18px",
                      background: "transparent",
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      color: colors.text,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !form.title.trim()}
                    style={{
                      padding: "10px 18px",
                      background: colors.accent,
                      color: colors.accentText,
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                      opacity: saving || !form.title.trim() ? 0.5 : 1,
                    }}
                  >
                    {saving ? "Enregistrement..." : modal.editing ? "Mettre à jour" : "Créer"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
