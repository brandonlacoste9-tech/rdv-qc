"use client";
import { useState, useEffect } from "react";

const DAYS_SHORT = ["D", "L", "M", "M", "J", "V", "S"];
const DAYS_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// Generate time slots every 30 min from 06:00 to 22:00
function genSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h < 22; h++) {
    slots.push(`${String(h).padStart(2,"0")}:00`);
    slots.push(`${String(h).padStart(2,"0")}:30`);
  }
  return slots;
}
const ALL_SLOTS = genSlots();

// dayOfWeek -> Set<"HH:MM">
type WeekSchedule = Record<number, Set<string>>;

function parseIntervalsToSlots(intervals: any[]): WeekSchedule {
  const result: WeekSchedule = {};
  for (let d = 0; d < 7; d++) result[d] = new Set();
  for (const iv of intervals) {
    if (!iv.isActive) continue;
    const [sh, sm] = iv.startTime.split(":").map(Number);
    const [eh, em] = iv.endTime.split(":").map(Number);
    const startMin = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);
    for (const slot of ALL_SLOTS) {
      const [hh, mm] = slot.split(":").map(Number);
      const slotMin = hh * 60 + mm;
      if (slotMin >= startMin && slotMin < endMin) {
        result[iv.dayOfWeek].add(slot);
      }
    }
  }
  return result;
}

function slotsToIntervals(day: number, slots: Set<string>): any[] {
  if (slots.size === 0) return [];
  const sorted = [...slots].sort();
  const intervals: any[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const [ph, pm] = prev.split(":").map(Number);
    const [ch, cm] = sorted[i].split(":").map(Number);
    const prevMin = ph * 60 + pm;
    const currMin = ch * 60 + cm;
    if (currMin - prevMin > 30) {
      const [eh, em] = prev.split(":").map(Number);
      const endMin = eh * 60 + em + 30;
      intervals.push({ dayOfWeek: day, startTime: start, endTime: `${String(Math.floor(endMin/60)).padStart(2,"0")}:${String(endMin%60).padStart(2,"0")}`, isActive: true });
      start = sorted[i];
    }
    prev = sorted[i];
  }
  const [eh, em] = prev.split(":").map(Number);
  const endMin = eh * 60 + em + 30;
  intervals.push({ dayOfWeek: day, startTime: start, endTime: `${String(Math.floor(endMin/60)).padStart(2,"0")}:${String(endMin%60).padStart(2,"0")}`, isActive: true });
  return intervals;
}

export default function AvailabilityPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(() => {
    const r: WeekSchedule = {};
    for (let d = 0; d < 7; d++) r[d] = new Set();
    return r;
  });
  const [scheduleName, setScheduleName] = useState("Heures de travail");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v2/me").then(r => r.json()).then(user => {
      const schedule = user.schedules?.[0];
      if (schedule) {
        setScheduleName(schedule.name || "Heures de travail");
        const intervals = schedule.intervals || [];
        if (intervals.length > 0) {
          setWeekSchedule(parseIntervalsToSlots(intervals));
        } else {
          // Default: Mon-Fri 09:00-17:00
          const defaults: WeekSchedule = {};
          for (let d = 0; d < 7; d++) defaults[d] = new Set();
          const defaultSlots = ALL_SLOTS.filter(s => {
            const [h] = s.split(":").map(Number);
            return h >= 9 && h < 17;
          });
          for (let d = 1; d <= 5; d++) defaults[d] = new Set(defaultSlots);
          setWeekSchedule(defaults);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const isToday = (d: number) => {
    const t = new Date();
    return t.getDate() === d && t.getMonth() === month && t.getFullYear() === year;
  };
  const isSelected = (d: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };
  const hasAvailability = (d: number) => {
    const dow = new Date(year, month, d).getDay();
    return weekSchedule[dow]?.size > 0;
  };

  const selectDate = (d: number) => setSelectedDate(new Date(year, month, d));

  const selectedDow = selectedDate?.getDay() ?? -1;

  const toggleSlot = (slot: string) => {
    if (selectedDow < 0) return;
    setWeekSchedule(prev => {
      const next = { ...prev };
      const daySet = new Set(prev[selectedDow]);
      if (daySet.has(slot)) daySet.delete(slot);
      else daySet.add(slot);
      next[selectedDow] = daySet;
      return next;
    });
    setSaved(false);
  };

  const saveAvailability = async () => {
    setSaving(true);
    const allIntervals: any[] = [];
    for (let d = 0; d < 7; d++) {
      const ivs = slotsToIntervals(d, weekSchedule[d]);
      allIntervals.push(...ivs);
    }
    await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleName, intervals: allIntervals }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedDaySlots = selectedDow >= 0 ? weekSchedule[selectedDow] : new Set<string>();
  const selectedDateLabel = selectedDate
    ? `${DAYS_FULL[selectedDow].toUpperCase()} ${selectedDate.getDate()} ${MONTHS_FR[selectedDate.getMonth()].toUpperCase()}`
    : "";

  if (loading) return (
    <div style={s.bg}>
      <div style={{ color: "#c8a96e", fontFamily: "Inter, sans-serif", padding: 40 }}>Chargement...</div>
    </div>
  );

  return (
    <div style={s.bg}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.avatar}>P</div>
          <div>
            <div style={s.name}>Planxo</div>
            <div style={s.subtitle}>Gérez vos disponibilités</div>
          </div>
        </div>

        {/* Schedule name */}
        <div style={{ marginBottom: 20 }}>
          <label style={s.label}>Nom de l'horaire</label>
          <input
            value={scheduleName}
            onChange={e => setScheduleName(e.target.value)}
            style={s.input}
          />
        </div>

        <div style={s.layout}>
          {/* Calendar */}
          <div style={s.calCard}>
            {/* Month nav */}
            <div style={s.monthNav}>
              <span style={s.monthLabel}>{MONTHS_FR[month]} {year}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={prevMonth} style={s.navBtn}>‹</button>
                <button onClick={nextMonth} style={s.navBtn}>›</button>
              </div>
            </div>

            {/* Day headers */}
            <div style={s.grid7}>
              {DAYS_SHORT.map(d => (
                <div key={d} style={s.dayHeader}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={s.grid7}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const selected = isSelected(d);
                const tod = isToday(d);
                const hasAvail = hasAvailability(d);
                return (
                  <div key={d} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <button
                      onClick={() => selectDate(d)}
                      style={{
                        ...s.dayBtn,
                        background: selected ? "#c8a96e" : tod ? "rgba(200,169,110,0.15)" : "transparent",
                        color: selected ? "#1a1208" : tod ? "#c8a96e" : "#e8d5b0",
                        fontWeight: (selected || tod) ? 700 : 400,
                        border: tod && !selected ? "1px solid rgba(200,169,110,0.4)" : "1px solid transparent",
                      }}
                    >
                      {d}
                    </button>
                    {hasAvail && (
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: selected ? "#1a1208" : "#c8a96e",
                        position: "absolute", bottom: 1
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slots panel */}
          {selectedDate && (
            <div style={s.slotsPanel}>
              <div style={s.slotsLabel}>{selectedDateLabel}</div>
              <div style={s.slotsHint}>Cliquez sur un créneau pour l'activer/désactiver</div>
              <div style={s.slotsGrid}>
                {ALL_SLOTS.map(slot => {
                  const active = selectedDaySlots.has(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      style={{
                        ...s.slotBtn,
                        background: active ? "rgba(200,169,110,0.2)" : "rgba(255,255,255,0.04)",
                        color: active ? "#c8a96e" : "#8a7a60",
                        border: active ? "1px solid rgba(200,169,110,0.5)" : "1px solid rgba(255,255,255,0.06)",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Quick presets */}
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => applyPreset(selectedDow, 9, 17)} style={s.presetBtn}>9h–17h</button>
                <button onClick={() => applyPreset(selectedDow, 8, 12)} style={s.presetBtn}>8h–12h</button>
                <button onClick={() => applyPreset(selectedDow, 13, 18)} style={s.presetBtn}>13h–18h</button>
                <button onClick={() => clearDay(selectedDow)} style={{ ...s.presetBtn, color: "#8a7a60", borderColor: "rgba(255,255,255,0.06)" }}>
                  Effacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Week summary */}
        <div style={s.summaryCard}>
          <div style={s.summaryTitle}>Résumé de la semaine</div>
          <div style={s.summaryGrid}>
            {DAYS_FULL.map((dayName, dow) => {
              const slots = weekSchedule[dow];
              const ivs = slotsToIntervals(dow, slots);
              const isActive = slots.size > 0;
              return (
                <div key={dow} style={{
                  ...s.summaryRow,
                  opacity: isActive ? 1 : 0.4,
                  background: selectedDow === dow ? "rgba(200,169,110,0.08)" : "transparent",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? "#e8d5b0" : "#6a5a40", minWidth: 90 }}>
                    {dayName.slice(0, 3).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: "#8a7a60", flex: 1 }}>
                    {isActive
                      ? ivs.map(iv => `${iv.startTime}–${iv.endTime}`).join(", ")
                      : "Indisponible"}
                  </span>
                  <span style={{ fontSize: 11, color: "#5a4a30" }}>
                    {isActive ? `${slots.size} créneaux` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <button
            onClick={saveAvailability}
            disabled={saving}
            style={{
              ...s.saveBtn,
              background: saved ? "#2a6e3a" : saving ? "#4a3a20" : "#c8a96e",
              color: saved ? "#fff" : saving ? "#8a7a60" : "#1a1208",
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Enregistrer les disponibilités"}
          </button>
          <a href="/dashboard" style={{ fontSize: 13, color: "#8a7a60", textDecoration: "none" }}>← Tableau de bord</a>
        </div>
      </div>
    </div>
  );

  function applyPreset(dow: number, startH: number, endH: number) {
    setWeekSchedule(prev => {
      const next = { ...prev };
      const daySet = new Set<string>();
      for (const slot of ALL_SLOTS) {
        const [h] = slot.split(":").map(Number);
        if (h >= startH && h < endH) daySet.add(slot);
      }
      next[dow] = daySet;
      return next;
    });
    setSaved(false);
  }

  function clearDay(dow: number) {
    setWeekSchedule(prev => {
      const next = { ...prev };
      next[dow] = new Set();
      return next;
    });
    setSaved(false);
  }
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "#1a1208",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#e8d5b0",
    padding: "32px 16px 80px",
  },
  container: {
    maxWidth: 780,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#c8a96e",
    color: "#1a1208",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 700,
    flexShrink: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e8d5b0",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: 13,
    color: "#8a7a60",
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: "#8a7a60",
    display: "block",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid rgba(200,169,110,0.2)",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    width: 260,
    background: "rgba(255,255,255,0.04)",
    color: "#e8d5b0",
  },
  layout: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  calCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    border: "1px solid rgba(200,169,110,0.12)",
    padding: "20px 18px",
    minWidth: 280,
    flex: "0 0 auto",
  },
  monthNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "#e8d5b0",
    textTransform: "capitalize",
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid rgba(200,169,110,0.2)",
    background: "rgba(255,255,255,0.04)",
    color: "#c8a96e",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  grid7: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px 2px",
  },
  dayHeader: {
    fontSize: 11,
    color: "#6a5a40",
    textAlign: "center",
    padding: "4px 0 8px",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.1s",
    padding: 0,
    margin: "0 auto",
  },
  slotsPanel: {
    flex: 1,
    minWidth: 260,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    border: "1px solid rgba(200,169,110,0.12)",
    padding: "20px 18px",
  },
  slotsLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#c8a96e",
    marginBottom: 4,
    letterSpacing: "0.5px",
  },
  slotsHint: {
    fontSize: 11,
    color: "#6a5a40",
    marginBottom: 14,
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 6,
    maxHeight: 320,
    overflowY: "auto",
  },
  slotBtn: {
    padding: "8px 4px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.1s",
    textAlign: "center",
  },
  presetBtn: {
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "transparent",
    color: "#c8a96e",
    fontFamily: "Inter, sans-serif",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    border: "1px solid rgba(200,169,110,0.12)",
    padding: "18px 20px",
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#8a7a60",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 14,
  },
  summaryGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 10px",
    borderRadius: 8,
  },
  saveBtn: {
    padding: "12px 28px",
    borderRadius: 9999,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
    transition: "all 0.2s",
  },
};
