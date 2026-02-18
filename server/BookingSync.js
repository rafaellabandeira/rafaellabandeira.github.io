// server/BookingSync.js
import ical from "node-ical";
import axios from "axios";
import fs from "fs";
import path from "path";

// URL iCal de Booking (cambia por la tuya si es necesario)
const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// Ruta para guardar reservas locales
const RESERVAS_JSON = path.join(process.cwd(), "server/reservas.json");

/**
 * Descarga y parsea el iCal de Booking.
 * Devuelve un objeto con arrays de fechas ocupadas para cada cabaña.
 */
export async function sincronizarReservas() {
  try {
    const response = await axios.get(ICAL_URL);
    const data = ical.parseICS(response.data);

    const fechasCampanilla = [];
    const fechasTejo = []; // si tuvieras otra cabaña, ajusta aquí

    for (const key in data) {
      if (data[key].type === "VEVENT") {
        const start = data[key].start.toISOString().split("T")[0];
        const end = data[key].end.toISOString().split("T")[0];

        let current = new Date(start);
        const endDate = new Date(end);

        while (current < endDate) {
          const fecha = current.toISOString().split("T")[0];
          // Guardamos para Campanilla (puedes agregar lógica para Tejo si tienes otro iCal)
          fechasCampanilla.push(fecha);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const reservas = {
      campanilla: fechasCampanilla,
      tejo: fechasTejo
    };

    // Guardar en JSON local
    fs.writeFileSync(RESERVAS_JSON, JSON.stringify(reservas, null, 2));
    console.log("✅ reservas.json actualizado correctamente");

    return reservas;

  } catch (err) {
    console.error("Error leyendo iCal de Booking:", err.message);
    // Devolver JSON local si falla
    try {
      const backup = fs.readFileSync(RESERVAS_JSON, "utf-8");
      console.log("⚠️ Usando reservas.json de backup");
      return JSON.parse(backup);
    } catch (e) {
      console.error("No hay backup disponible:", e.message);
      return { campanilla: [], tejo: [] };
    }
  }
}

