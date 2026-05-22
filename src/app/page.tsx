"use client";
import { LangProvider, useLang } from "@/lib/i18n";
import { Calendar, Clock, Shield, Globe, Users, Video, ChevronRight, Sparkles, Check } from "lucide-react";

export default function Home() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}

function Page() {
  const { t, lang, toggleLang } = useLang();
  const icons = [Calendar, Clock, Globe, Shield];

  return (
    <div className="relative min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-40" style={{ background: "rgba(10,14,26,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(212,168,83,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold gold-gradient">RDV-QC</span>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-gold/30">
              {lang === "fr" ? "EN" : "FR"}
            </button>
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{t.nav.login}</a>
            <a href="#" className="gold-btn text-sm px-5 py-2">{t.nav.cta}</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            <span className="gold-gradient">{t.hero.title}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">{t.hero.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="#" className="gold-btn text-lg px-10 py-4 inline-flex items-center gap-2">
              <Calendar className="w-5 h-5" /> {t.hero.cta}
            </a>
            <a href="#" className="ghost-btn text-lg px-10 py-4">{t.hero.secondary}</a>
          </div>
          <p className="text-sm text-slate-500">{t.hero.trust}</p>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500 mb-8 tracking-wide uppercase">{t.trust}</p>
          <div className="flex justify-center gap-12 opacity-30">
            {["Desjardins", "Bombardier", "Québecor", "Coveo", "Lightspeed"].map((c) => (
              <span key={c} className="text-lg font-bold text-white">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.how.title}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">{t.how.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {t.how.steps.map((step, i) => {
              const Icon = icons[i % icons.length];
              return (
                <div key={i} className="card-glass p-6 text-center group hover:border-gold/30 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.15)" }}>
                    <Icon className="w-6 h-6" style={{ color: "var(--gold)" }} />
                  </div>
                  <p className="text-xs font-bold text-gold/60 mb-2">{i + 1}</p>
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" style={{ background: "rgba(10,14,26,0.5)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.features.title}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.features.items.map((f, i) => {
              const FIcon = [Clock, Shield, Globe, Users, Video, Calendar][i % 6];
              return (
                <div key={i} className="card-glass p-6 hover:border-gold/30 transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.15)" }}>
                    <FIcon className="w-5 h-5" style={{ color: "var(--cyan)" }} />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t.pricing.title}</h2>
            <div className="inline-flex rounded-xl border border-white/10 p-1">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white">{t.pricing.yearly}</button>
              <button className="px-4 py-2 rounded-lg text-sm text-slate-400">{t.pricing.monthly}</button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.pricing.plans.map((plan, i) => (
              <div key={i} className={`card-glass p-8 relative ${plan.popular ? "border-gold/30" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 gold-btn text-xs px-4 py-1 rounded-full">
                    {lang === "fr" ? "Populaire" : "Most Popular"}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <a href="#" className={`block text-center py-3 rounded-xl font-semibold mb-6 transition-all ${plan.popular ? "gold-btn" : "ghost-btn"}`}>
                  {plan.cta}
                </a>
                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--green)" }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center card-glass p-12">
          <Sparkles className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--gold)" }} />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t.cta.title}</h2>
          <p className="text-slate-400 mb-8">{t.cta.subtitle}</p>
          <a href="#" className="gold-btn text-lg px-10 py-4 inline-flex items-center gap-2">
            {t.cta.button} <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center">
        <p className="text-sm text-slate-600">RDV-QC © {new Date().getFullYear()} — {t.footer.rights}</p>
      </footer>
    </div>
  );
}
