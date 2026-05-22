const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Demo user
  const user = await prisma.user.upsert({
    where: { email: "info@planxo.ca" },
    update: {},
    create: {
      id: "demo-user-001",
      username: "planxo",
      name: "Planxo Démo",
      email: "info@planxo.ca",
      timeZone: "America/Toronto",
    },
  });

  // Default schedule
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

  // Availability: Mon-Fri 9-5
  const days = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "16:00" },
  ];

  for (const day of days) {
    await prisma.availability.upsert({
      where: {
        id: `avail-${schedule.id}-${day.dayOfWeek}`,
      },
      update: {},
      create: {
        id: `avail-${schedule.id}-${day.dayOfWeek}`,
        scheduleId: schedule.id,
        ...day,
      },
    });
  }

  // Event types
  const eventTypes = [
    {
      id: "et-consultation-30",
      title: "Consultation de 30 minutes",
      slug: "consultation-30min",
      description: "Une consultation rapide pour discuter de vos besoins.",
      length: 30,
      location: "google-meet",
    },
    {
      id: "et-reunion-60",
      title: "Réunion d'une heure",
      slug: "reunion-1h",
      description: "Réunion détaillée pour faire avancer vos projets.",
      length: 60,
      location: "google-meet",
    },
    {
      id: "et-appel-15",
      title: "Appel rapide de 15 minutes",
      slug: "appel-15min",
      description: "Un appel express pour une question rapide.",
      length: 15,
      location: "phone",
    },
  ];

  for (const et of eventTypes) {
    await prisma.eventType.upsert({
      where: { id: et.id },
      update: {},
      create: {
        ...et,
        userId: user.id,
      },
    });
  }

  // Sample bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  await prisma.booking.upsert({
    where: { id: "booking-001" },
    update: {},
    create: {
      id: "booking-001",
      eventTypeId: "et-consultation-30",
      userId: user.id,
      guestName: "Marie Tremblay",
      guestEmail: "marie@example.com",
      guestNotes: "J'aimerais discuter de l'intégration Calendly.",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      status: "confirmed",
    },
  });

  await prisma.booking.upsert({
    where: { id: "booking-002" },
    update: {},
    create: {
      id: "booking-002",
      eventTypeId: "et-reunion-60",
      userId: user.id,
      guestName: "Jean Bouchard",
      guestEmail: "jean@example.com",
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 60 * 60000),
      status: "confirmed",
    },
  });

  console.log("Seed complete!");
  console.log(`  User: ${user.email}`);
  console.log(`  Event types: ${eventTypes.length}`);
  console.log(`  Schedule: ${schedule.name}`);
  console.log(`  Sample bookings: 2`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
