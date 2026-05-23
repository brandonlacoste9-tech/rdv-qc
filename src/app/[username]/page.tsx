import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function UserHubPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const { data: user } = await supabase
    .from("users")
    .select("id, name, username, avatarUrl, bio")
    .eq("username", username)
    .single();

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", background: "#fff", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Cal Sans',sans-serif", fontSize: 32, marginBottom: 8 }}>Utilisateur introuvable</h1>
          <p style={{ color: "#898989" }}>Ce profil n&apos;existe pas.</p>
          <a href="/" style={{ color: "#242424", fontWeight: 600 }}>Retour à l&apos;accueil</a>
        </div>
      </div>
    );
  }

  const { data: events } = await supabase
    .from("EventType")
    .select("id, title, slug, description, length, location, price, color")
    .eq("userId", user.id)
    .eq("isActive", true)
    .eq("isPrivate", false)
    .order("position", { ascending: true });

  const locIcon = (loc: string) =>
    loc === "google-meet" ? "📹 Google Meet" : loc === "zoom" ? "📹 Zoom" : loc === "phone" ? "📞 Téléphone" : "📍 En personne";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter',sans-serif", background: "#f9fafb", position: "relative", zIndex: 1 }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, marginBottom: 14 }}>
          {user.name?.[0] || "?"}
        </div>
        <h1 style={{ fontFamily: "'Cal Sans',sans-serif", fontSize: 28, fontWeight: 700, margin: "0 0 4px" }}>{user.name}</h1>
        <p style={{ color: "#898989", fontSize: 14, margin: 0 }}>planxo.ca/{user.username}</p>
      </div>

      {/* Event grid */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontFamily: "'Cal Sans',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Types de rendez-vous</h2>
        {(!events || events.length === 0) ? (
          <p style={{ color: "#898989" }}>Aucun type de rendez-vous public.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map((et: any) => (
              <Link
                key={et.id}
                href={`/${username}/${et.slug}`}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "20px 24px", borderRadius: 14, background: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)", textDecoration: "none",
                  transition: "all .15s", color: "inherit",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: et.color, display: "inline-block", flexShrink: 0 }} />
                    <h3 style={{ fontFamily: "'Cal Sans',sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>{et.title}</h3>
                  </div>
                  <div style={{ fontSize: 13, color: "#898989", display: "flex", gap: 12 }}>
                    <span>🕐 {et.length} min</span>
                    <span>{locIcon(et.location)}</span>
                    {et.price > 0 && <span style={{ fontWeight: 600, color: "#92400e" }}>{(et.price / 100).toFixed(2)} $</span>}
                  </div>
                </div>
                <span style={{ color: "#898989", fontSize: 18 }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
