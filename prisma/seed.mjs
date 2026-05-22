import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const user = await prisma.user.upsert({
  where: { email: "info@planxo.ca" },
  update: {},
  create: {
    id: "demo-user-001",
    username: "planxo",
    name: "Planxo",
    email: "info@planxo.ca",
    timeZone: "America/Toronto",
  },
});

const schedule = await prisma.schedule.upsert({
  where: { id: "demo-schedule-001" },
  update: {},
  create: {
    id: "demo-schedule-001",
    userId: user.id,
    name: "Heures de travail",
    timeZone: "America/Toronto",
    isDefault: true,
  },
});

for (const d of [1, 2, 3, 4, 5]) {
  await prisma.availability.upsert({
    where: { id: `avail-${schedule.id}-${d}` },
    update: {},
    create: {
      id: `avail-${schedule.id}-${d}`,
      scheduleId: schedule.id,
      dayOfWeek: d,
      startTime: "09:00",
      endTime: d === 5 ? "16:00" : "17:00",
    },
  });
}

const ets = [
  { id: "et-consultation-30", title: "Consultation de 30 minutes", slug: "consultation-30min", length: 30, location: "google-meet" },
  { id: "et-reunion-60", title: "Reunion d'une heure", slug: "reunion-1h", length: 60, location: "google-meet" },
  { id: "et-appel-15", title: "Appel rapide de 15 minutes", slug: "appel-15min", length: 15, location: "phone" },
];

for (const et of ets) {
  await prisma.eventType.upsert({
    where: { id: et.id },
    update: {},
    create: { ...et, userId: user.id },
  });
}

console.log(`SEEDED: User=${user.email}, EventTypes=${ets.length}`);
await prisma.$disconnect();
