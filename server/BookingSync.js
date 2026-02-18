// server/BookingSync.js
import ical from "node-ical";
import axios from "axios";
import fs from "fs";
import path from "path";

const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";
const JSON_PATH = path.join(process.cwd(), "reservas.json");

/**
 * Descarga el iCal de Booking, parsea todos los eventos
 * y guarda las fechas ocupadas en reservas.json.
 */
export async function sincronizarReservas() {
  try {
    const response = await axios.get(ICAL_URL);
    const data = ical.parseICS(response.data);

    const fechasOcupadas = [];

    for (const key in data) {
      const event = data[key];
      if (event.type === "VEVENT") {
        const start = event.start.toISOString().split("T")[0];
        const end = event.end.toISOString().split("T")[0];

        let current = new Date(start);
        const endDate = new Date(end);

        while (current < endDate) {
          fechasOcupadas.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }

        console.log(`Evento: "${event.summary || "sin título"}" → ${start} a ${end}`);
      }
    }

    console.log("✅ Fechas ocupadas obtenidas del iCal:", fechasOcupadas);

    // Guardar en JSON
    fs.writeFileSync(JSON_PATH, JSON.stringify({ campanilla: fechasOcupadas }, null, 2));
    console.log("✅ reservas.json actualizado correctamente");

    return fechasOcupadas;

  } catch (err) {
    console.error("❌ Error leyendo iCal de Booking:", err.message);
    return [];
  }
}
