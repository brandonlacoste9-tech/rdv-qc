"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "fr" | "en";

const translations = {
  fr: {
    nav: { cta: "Commencer gratuitement", login: "Connexion" },
    hero: {
      title: "Planifiez sans effort",
      subtitle: "Rejoignez les professionnels québécois qui réservent leurs rendez-vous avec l'outil #1 de planification.",
      cta: "Inscrivez-vous gratuitement",
      secondary: "Voir une démo",
      trust: "Aucune carte de crédit requise",
    },
    trust: "Plus de 2 000 entreprises québécoises nous font confiance",
    how: {
      title: "La planification simplifiée",
      subtitle: "Assez simple pour les travailleurs autonomes, assez puissant pour les grandes équipes.",
      steps: [
        { title: "Connectez vos calendriers", desc: "Google, Outlook, iCloud — tous vos calendriers au même endroit." },
        { title: "Définissez vos disponibilités", desc: "Choisissez vos heures, votre fuseau horaire et vos préférences." },
        { title: "Personnalisez vos types de rendez-vous", desc: "Consultation 30min, appel découverte 1h — créez ce dont vous avez besoin." },
        { title: "Partagez votre lien", desc: "Envoyez votre lien de réservation par courriel, site web ou signature." },
      ],
    },
    features: {
      title: "Plus qu'un simple lien de réservation",
      subtitle: "Des fonctionnalités pensées pour les professionnels d'ici.",
      items: [
        { title: "Rappels automatiques", desc: "Réduisez les absences avec des rappels courriel et SMS." },
        { title: "Paiement intégré", desc: "Acceptez les paiements avant la rencontre avec Stripe." },
        { title: "Formulaires personnalisés", desc: "Questions de qualification avant la réservation." },
        { title: "Fuseau horaire détecté", desc: "L'heure du client automatiquement ajustée." },
        { title: "Lien d'équipe", desc: "Partagez une page commune pour toute votre équipe." },
        { title: "Conférences vidéo", desc: "Zoom, Google Meet ou Teams automatiquement ajoutés." },
      ],
      cta: "Voir toutes les fonctionnalités",
    },
    pricing: {
      title: "Choisissez votre forfait",
      yearly: "Facturation annuelle",
      monthly: "Facturation mensuelle",
      plans: [
        {
          name: "Gratuit", price: "0$", period: "/mois",
          desc: "Pour commencer", features: ["1 type de rendez-vous", "1 calendrier connecté", "Lien de réservation", "Rappels courriel"], cta: "Commencer", popular: false,
        },
        {
          name: "Pro", price: "49$", period: "/mois",
          desc: "Pour les professionnels", features: ["Types de rendez-vous illimités", "6 calendriers", "Paiements Stripe", "Rappels SMS", "Formulaires personnalisés", "Vidéo intégrée"], cta: "Essai gratuit", popular: true,
        },
        {
          name: "Équipe", price: "99$", period: "/mois",
          desc: "Pour les équipes", features: ["Tout Pro +", "Pages d'équipe", "Admin centralisé", "Routage intelligent", "Analytique d'équipe", "Support prioritaire"], cta: "Essai gratuit", popular: false,
        },
      ],
    },
    cta: {
      title: "Prêt à simplifier vos rendez-vous?",
      subtitle: "Rejoignez les professionnels québécois qui gagnent du temps chaque semaine.",
      button: "Commencer gratuitement",
    },
    footer: { rights: "Tous droits réservés." },
  },
  en: {
    nav: { cta: "Start for free", login: "Log In" },
    hero: {
      title: "Easy scheduling ahead",
      subtitle: "Join Quebec professionals who book meetings with the #1 scheduling tool.",
      cta: "Sign up free",
      secondary: "See a demo",
      trust: "No credit card required",
    },
    trust: "Trusted by more than 2,000 Quebec businesses",
    how: {
      title: "Scheduling made simple",
      subtitle: "Easy enough for individuals, powerful enough for enterprise teams.",
      steps: [
        { title: "Connect your calendars", desc: "Google, Outlook, iCloud — all your calendars in one place." },
        { title: "Set your availability", desc: "Choose your hours, timezone, and preferences." },
        { title: "Customize event types", desc: "30min consult, 1hr discovery call — create what you need." },
        { title: "Share your link", desc: "Send your booking link via email, website, or signature." },
      ],
    },
    features: {
      title: "More than just a scheduling link",
      subtitle: "Features built for local professionals.",
      items: [
        { title: "Automatic reminders", desc: "Reduce no-shows with email and SMS reminders." },
        { title: "Built-in payments", desc: "Accept payment before the meeting with Stripe." },
        { title: "Custom forms", desc: "Qualification questions before booking." },
        { title: "Timezone detection", desc: "Client's time automatically adjusted." },
        { title: "Team link", desc: "Share a common page for your entire team." },
        { title: "Video conferencing", desc: "Zoom, Google Meet or Teams auto-added." },
      ],
      cta: "See all features",
    },
    pricing: {
      title: "Pick the perfect plan",
      yearly: "Billed yearly",
      monthly: "Billed monthly",
      plans: [
        {
          name: "Free", price: "$0", period: "/mo",
          desc: "For getting started", features: ["1 event type", "1 connected calendar", "Booking link", "Email reminders"], cta: "Get started", popular: false,
        },
        {
          name: "Pro", price: "$49", period: "/mo",
          desc: "For professionals", features: ["Unlimited event types", "6 calendars", "Stripe payments", "SMS reminders", "Custom forms", "Built-in video"], cta: "Free trial", popular: true,
        },
        {
          name: "Team", price: "$99", period: "/mo",
          desc: "For teams", features: ["Everything in Pro +", "Team pages", "Centralized admin", "Smart routing", "Team analytics", "Priority support"], cta: "Free trial", popular: false,
        },
      ],
    },
    cta: {
      title: "Ready to simplify your scheduling?",
      subtitle: "Join Quebec professionals saving hours every week.",
      button: "Start for free",
    },
    footer: { rights: "All rights reserved." },
  },
};

const LangContext = createContext<{
  lang: Lang;
  t: typeof translations.fr;
  toggleLang: () => void;
} | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const toggleLang = () => setLang((l) => (l === "fr" ? "en" : "fr"));
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
