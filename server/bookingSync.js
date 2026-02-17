const fs = require("fs");
const path = require("path");
const https = require("https");

// 👉 URL iCal de Booking (Campanilla)
const BOOKING_ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// 👉 dónde guardaremos las fechas bloqueadas
const outputFile = path.join(__dirname, "../js/reservas.json");

function downloadICAL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseICAL(icalData) {
  const events = icalData.split("BEGIN:VEVENT");
  const blockedDates = [];

  events.forEach(event => {
    const startMatch = event.match(/DTSTART;VALUE=DATE:(\d+)/);
    const endMatch = event.match(/DTEND;VALUE=DATE:(\d+)/);

    if (startMatch && endMatch) {
      let start = startMatch[1];
      let end = endMatch[1];

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

      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        blockedDates.push(d.toISOString().split("T")[0]);
      }
    }
  });

  return blockedDates;
}

async function syncBookingCalendar() {
  try {
    console.log("🔄 Sincronizando calendario Booking...");

    const icalData = await downloadICAL(BOOKING_ICAL_URL);
    const blockedDates = parseICAL(icalData);

    fs.writeFileSync(outputFile, JSON.stringify(blockedDates, null, 2));

    console.log("✅ Fechas bloqueadas actualizadas:", blockedDates.length);
  } catch (err) {
    console.error("❌ Error sincronizando Booking:", err);
  }
}

module.exports = syncBookingCalendar;
