"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Copy, Plus, Trash2, Clock, AlertCircle, Check, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMEZONES = [
  "America/Toronto", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "America/Honolulu", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Australia/Sydney",
];

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
}

const colors = {
  bg: "#1a1008",
  bg2: "#241810",
  text: "#e8d5c4",
  textMuted: "#c4a882",
  accent: "#c47f3a",
  accentHover: "#d4944e",
  accentText: "#1a1008",
  border: "rgba(196,127,58,0.12)",
  cardBg: "#241810",
  gold: "#d4a853",
  dimText: "#6b5040",
  error: "#ef4444",
};

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({});
  const [timezone, setTimezone] = useState("America/Toronto");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/availability");
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const weekly: Record<number, DaySchedule> = {};
        for (let i = 0; i < 7; i++) {
          weekly[i] = { enabled: false, slots: [] };
        }

        if (data.intervals) {
          data.intervals.forEach((row: any) => {
            const day = row.dayOfWeek;
            weekly[day].enabled = true;
            weekly[day].slots.push({
              id: row.id,
              startTime: row.startTime.substring(0, 5),
              endTime: row.endTime.substring(0, 5),
              isActive: row.isActive
            });
          });
        }

        // Fill empty active days with default slots
        Object.keys(weekly).forEach(k => {
          const day = parseInt(k);
          if (weekly[day].enabled && weekly[day].slots.length === 0) {
            weekly[day].slots = [{ id: `new-${Date.now()}`, startTime: "09:00", endTime: "17:00", isActive: true }];
          }
        });

        setSchedule(weekly);
        if (data.timeZone) setTimezone(data.timeZone);
      } catch (err: any) {
        setError(err.message || "Failed to load availability");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleDay = (day: number) => {
    setSchedule((prev) => {
      const isEnabled = !prev[day].enabled;
      return {
        ...prev,
        [day]: {
          ...prev[day],
          enabled: isEnabled,
          slots: isEnabled && prev[day].slots.length === 0 
            ? [{ id: `new-${Date.now()}`, startTime: "09:00", endTime: "17:00", isActive: true }]
            : prev[day].slots,
        },
      };
    });
  };

  const addSlot = (day: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { id: `new-${Date.now()}`, startTime: "17:00", endTime: "18:00", isActive: true }],
      },
    }));
    setExpandedDay(day);
  };

  const removeSlot = (day: number, slotId: string) => {
    setSchedule((prev) => {
      const newSlots = prev[day].slots.filter((s) => s.id !== slotId);
      return {
        ...prev,
        [day]: {
          ...prev[day],
          enabled: newSlots.length > 0,
          slots: newSlots,
        },
      };
    });
  };

  const updateSlot = (day: number, slotId: string, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const copyDaySchedule = (fromDay: number) => {
    const source = schedule[fromDay];
    setSchedule((prev) => {
      const next = { ...prev };
      for (let i = 0; i < 7; i++) {
        if (i !== fromDay) {
          next[i] = {
            enabled: source.enabled,
            slots: source.slots.map(s => ({ ...s, id: `copy-${Date.now()}-${Math.random()}` }))
          };
        }
      }
      return next;
    });
    setSuccess("Copied to all days!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const intervals: any[] = [];
      Object.entries(schedule).forEach(([day, data]) => {
        if (data.enabled) {
          data.slots.forEach(slot => {
            intervals.push({
              dayOfWeek: parseInt(day),
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: true
            });
          });
        }
      });

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone, intervals }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      setSuccess("Availability saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Error saving availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1008]">
        <Loader2 className="w-8 h-8 animate-spin text-[#c47f3a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1008] text-[#e8d5c4] p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">Availability</h1>
          <p className="text-[#c4a882]">Configure when you are available for bookings.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
            <Check className="w-5 h-5" />
            <p>{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Timezone Section */}
          <section className="bg-[#241810] rounded-2xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-[#c4a882] mb-3">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#1a1008] border border-white/10 rounded-xl p-3 outline-none focus:border-[#c47f3a] transition-colors"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </section>

          {/* Schedule Section */}
          <section className="bg-[#241810] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#c47f3a]" />
              <h2 className="font-semibold">Weekly Hours</h2>
            </div>

            <div className="divide-y divide-white/5">
              {DAYS.map((day, idx) => (
                <div key={day} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => toggleDay(idx)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${schedule[idx]?.enabled ? 'bg-[#c47f3a]' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${schedule[idx]?.enabled ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className={`font-medium ${schedule[idx]?.enabled ? 'text-[#e8d5c4]' : 'text-[#6b5040]'}`}>{day}</span>
                    </div>

                    {schedule[idx]?.enabled && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => addSlot(idx)} className="p-2 hover:bg-white/5 rounded-lg text-[#c4a882] transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => copyDaySchedule(idx)} className="p-2 hover:bg-white/5 rounded-lg text-[#c4a882] transition-colors" title="Copy to all days">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandedDay(expandedDay === idx ? null : idx)} className="p-2 hover:bg-white/5 rounded-lg text-[#c4a882] transition-colors">
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedDay === idx ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {schedule[idx]?.enabled && (
                    <div className={`mt-4 space-y-3 ${expandedDay === idx ? 'block' : 'hidden md:block'}`}>
                      {schedule[idx].slots.map((slot) => (
                        <div key={slot.id} className="flex items-center gap-3 pl-16">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(idx, slot.id, "startTime", e.target.value)}
                            className="bg-[#1a1008] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-[#c47f3a]"
                          />
                          <span className="text-[#6b5040]">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(idx, slot.id, "endTime", e.target.value)}
                            className="bg-[#1a1008] border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-[#c47f3a]"
                          />
                          <button onClick={() => removeSlot(idx, slot.id)} className="p-2 text-red-400/50 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {schedule[idx]?.enabled && expandedDay !== idx && (
                    <div className="md:hidden mt-2 pl-16 text-sm text-[#c4a882]">
                      {schedule[idx].slots.map(s => `${s.startTime} - ${s.endTime}`).join(", ")}
                    </div>
                  )}

                  {!schedule[idx]?.enabled && (
                    <div className="mt-2 pl-16 text-sm text-[#6b5040]">Unavailable</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#c47f3a] hover:bg-[#d4944e] disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1008] font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#c47f3a]/10 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Availability"}
          </button>
        </div>

        <footer className="mt-12 p-6 bg-[#c47f3a]/5 border border-[#c47f3a]/10 rounded-2xl">
          <p className="text-sm text-[#c4a882] leading-relaxed">
            <strong className="text-[#c47f3a]">Pro Tip:</strong> You can add multiple slots per day to account for breaks. Use the copy icon to quickly apply your schedule across the entire week.
          </p>
        </footer>
      </div>
    </div>
  );
}
