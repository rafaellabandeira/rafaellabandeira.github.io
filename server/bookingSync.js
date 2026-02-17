import fetch from "node-fetch";

const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

function parseICalDates(text) {
  const events = text.split("BEGIN:VEVENT");
  const blocked = [];

  events.forEach(event => {
    const startMatch = event.match(/DTSTART;VALUE=DATE:(\d{8})/);
    const endMatch = event.match(/DTEND;VALUE=DATE:(\d{8})/);

    if (startMatch && endMatch) {
      const start = startMatch[1];
      const end = endMatch[1];

      const startDate = new Date(
        start.substring(0,4),
        start.substring(4,6)-1,
        start.substring(6,8)
      );

      const endDate = new Date(
        end.substring(0,4),
        end.substring(4,6)-1,
        end.substring(6,8)
      );

      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate()+1)) {
        blocked.push(d.toISOString().split("T")[0]);
      }
    }
  });

  return blocked;
}

export async function getBookingBlockedDates() {
  const res = await fetch(ICAL_URL);
  const text = await res.text();
  return parseICalDates(text);
}


