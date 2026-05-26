export interface IcsOptions {
  start: Date;
  end: Date;
  title: string;
  description: string;
  location: string;
  organizerName: string;
  organizerEmail: string;
}

export function generateIcs(options: IcsOptions): string {
  const { start, end, title, description, location, organizerName, organizerEmail } = options;

  // Format date to ICS standard: YYYYMMDDThhmmssZ
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const dtstamp = formatDate(new Date());
  const dtstart = formatDate(start);
  const dtend = formatDate(end);
  const uid = `${Date.now()}@planxo.ca`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Planxo//Scheduling Platform//FR
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Rappel
END:VALARM
END:VEVENT
END:VCALENDAR`.trim();
}
