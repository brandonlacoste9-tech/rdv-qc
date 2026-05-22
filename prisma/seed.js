const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function seed() {
  const u = await p.user.upsert({
    where: { email: "info@planxo.ca" },
    update: {},
    create: { id: "u1", username: "planxo", name: "Planxo", email: "info@planxo.ca" },
  });
  const s = await p.schedule.upsert({
    where: { id: "s1" },
    update: {},
    create: { id: "s1", userId: u.id, name: "Heures de travail", timeZone: "America/Toronto", isDefault: true },
  });
  for (const d of [1, 2, 3, 4, 5])
    await p.availability.upsert({
      where: { id: "a" + d },
      update: {},
      create: { id: "a" + d, scheduleId: s.id, dayOfWeek: d, startTime: "09:00", endTime: d === 5 ? "16:00" : "17:00" },
    });
  for (const et of [
    { id: "et1", title: "Consultation de 30 minutes", slug: "consultation-30min", length: 30, location: "google-meet" },
    { id: "et2", title: "Reunion d'une heure", slug: "reunion-1h", length: 60, location: "google-meet" },
    { id: "et3", title: "Appel rapide de 15 minutes", slug: "appel-15min", length: 15, location: "phone" },
  ])
    await p.eventType.upsert({ where: { id: et.id }, update: {}, create: { ...et, userId: u.id } });
  console.log("SEEDED user=" + u.email + " ets=3");
  await p.$disconnect();
}
seed();
