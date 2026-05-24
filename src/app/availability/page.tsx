"use client";

import { useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState({
    0: { enabled: false, start: "09:00", end: "17:00" },
    1: { enabled: true, start: "09:00", end: "17:00" },
    2: { enabled: true, start: "09:00", end: "17:00" },
    3: { enabled: true, start: "09:00", end: "17:00" },
    4: { enabled: true, start: "09:00", end: "17:00" },
    5: { enabled: true, start: "09:00", end: "17:00" },
    6: { enabled: false, start: "09:00", end: "17:00" },
  });

  const [overrides, setOverrides] = useState([
    { date: "Oct 14th", label: "Holiday (Full Day Off)" },
    { date: "Oct 23rd", label: "Afternoon (1:00pm – 5:00pm)" },
  ]);

  const toggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8f1e9", 
      padding: "40px 60px",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#8a6f5c" }}>PLANXO / Brandon Lero...</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: "#3f2a1f" }}>
            Availability Settings
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          
          {/* Routine Weekly Hours */}
          <div style={{
            background: "#3f2a1f",
            color: "#f8f1e9",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>Routine Weekly Hours</h3>
            
            {DAYS.map((day, index) => (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 12, 
                marginBottom: 10,
                background: "rgba(255,255,255,0.06)",
                padding: "8px 14px",
                borderRadius: 10
              }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={schedule[index].enabled}
                    onChange={() => toggleDay(index)}
                    style={{ accentColor: "#c47f3a" }}
                  />
                  <span style={{ width: 90 }}>{day}</span>
                </label>

                {schedule[index].enabled && (
                  <>
                    <input 
                      type="time" 
                      value={schedule[index].start}
                      onChange={e => {
                        const newSchedule = {...schedule};
                        newSchedule[index].start = e.target.value;
                        setSchedule(newSchedule);
                      }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #5c4637", background: "#2c2118", color: "#f8f1e9" }}
                    />
                    <span style={{ color: "#8a6f5c" }}>-</span>
                    <input 
                      type="time" 
                      value={schedule[index].end}
                      onChange={e => {
                        const newSchedule = {...schedule};
                        newSchedule[index].end = e.target.value;
                        setSchedule(newSchedule);
                      }}
                      style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #5c4637", background: "#2c2118", color: "#f8f1e9" }}
                    />
                  </>
                )}

                <button style={{ marginLeft: "auto", background: "none", border: "none", color: "#8a6f5c", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>

          {/* Calendar View */}
          <div style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>October 2025</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd" }}>Weekly</button>
                <button style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd" }}>View</button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 13 }}>
              {["S","M","T","W","T","F","S"].map((d,i) => (
                <div key={i} style={{ textAlign: "center", color: "#8a6f5c", padding: "4px 0" }}>{d}</div>
              ))}
              {Array.from({length: 35}).map((_,i) => (
                <div key={i} style={{ 
                  padding: "8px 0", 
                  textAlign: "center",
                  background: i === 17 || i === 18 ? "#c47f3a" : "transparent",
                  color: i === 17 || i === 18 ? "#fff" : "#3f2a1f",
                  borderRadius: 6
                }}>
                  {i > 3 && i < 34 ? i - 3 : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Overrides */}
        <div style={{ marginTop: 32 }}>
          <div style={{ 
            background: "#fff", 
            borderRadius: 16, 
            padding: 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Date overrides</h3>
              <span style={{ color: "#8a6f5c", fontSize: 13 }}>ⓘ</span>
            </div>
            <p style={{ color: "#8a6f5c", fontSize: 13, marginBottom: 16 }}>
              Add dates when your availability changes from your daily hours.
            </p>

            <div style={{ display: "grid", gap: 8 }}>
              {overrides.map((o, i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "#f8f1e9",
                  borderRadius: 8
                }}>
                  <div>{o.date} — {o.label}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer" }}>✏️</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer" }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            <button style={{ 
              marginTop: 16, 
              background: "#c47f3a", 
              color: "#fff", 
              border: "none", 
              padding: "9px 18px", 
              borderRadius: 8, 
              fontWeight: 600,
              cursor: "pointer"
            }}>
              + Add an override
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
// force redeploy Sun, May 24, 2026  3:13:55 PM
