// server/BookingSync.js
// Sincroniza reservas desde Booking iCal al archivo local reservas.json

import fs from "fs";
import ical from "node-ical";
import path from "path";

// Ruta del archivo de reservas local
const reservasFile = path.join(process.cwd(), "js", "reservas.json");

// Tu iCal de Booking
const BOOKING_ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

/**
 * Función para actualizar reservas desde iCal
 */
export async function syncBooking() {
  try {
    console.log("Sincronizando reservas desde Booking...");

    // Descargar y parsear el iCal
    const data = await ical.async.fromURL(BOOKING_ICAL_URL);

    // Arrays para cada cabaña
    const reservasCampanilla = [];
    const reservasTejo = [];

    for (const key in data) {
      const ev = data[key];
      if (ev.type === "VEVENT") {
        // Formatear fechas a yyyy-mm-dd
        const start = ev.start.toISOString().slice(0, 10);
        const end = ev.end.toISOString().slice(0, 10);

        // Booking marca el final como el día siguiente, vamos a marcar todos los días ocupados
        let current = new Date(start);
        const endDate = new Date(end);
        const dias = [];

        while (current < endDate) {
          dias.push(current.toISOString().slice(0, 10));
          current.setDate(current.getDate() + 1);
        }

        // Por título distinguimos cabaña (ajustar si tu iCal tiene otro texto)
        const summary = ev.summary.toLowerCase();
        if (summary.includes("campanilla")) {
          reservasCampanilla.push(...dias);
        } else if (summary.includes("tejo")) {
          reservasTejo.push(...dias);
        }
      }
    }

    // Eliminar duplicados
    const uniq = (arr) => [...new Set(arr)];

    const reservas = {
      campanilla: uniq(reservasCampanilla),
      tejo: uniq(reservasTejo),
    };

    // Guardar en reservas.json
    fs.writeFileSync(reservasFile, JSON.stringify(reservas, null, 2), "utf-8");
    console.log("Reservas sincronizadas correctamente.");

    return reservas;
  } catch (err) {
    console.error("Error sincronizando Booking:", err);
    return null;
  }
}
