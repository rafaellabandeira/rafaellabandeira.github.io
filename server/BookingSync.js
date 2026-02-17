// server/BookingSync.js
import ical from "node-ical";
import axios from "axios";
import fs from "fs";

// URL iCal de Booking
const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

/**
 * Descarga y parsea el iCal de Booking.
 * Devuelve un array con las fechas ocupadas en formato 'YYYY-MM-DD'
 * y actualiza reservas.json automáticamente.
 */
export async function sincronizarReservas() {
  try {
    // Descargar iCal
    const response = await axios.get(ICAL_URL);
    const data = ical.parseICS(response.data);

    const fechasOcupadas = [];

    // Recorrer todos los eventos
    for (const key in data) {
      const ev = data[key];
      if (ev.type === "VEVENT") {
        const start = ev.start.toISOString().split("T")[0];
        const end = ev.end.toISOString().split("T")[0];

        // Agregar todos los días del evento
        let current = new Date(start);
        const endDate = new Date(end);

        while (current < endDate) {
          fechasOcupadas.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    // Guardar en reservas.json
    fs.writeFileSync(
      "reservas.json",
      JSON.stringify({ campanilla: fechasOcupadas, tejo: [] }, null, 2)
    );

    console.log("✅ Fechas ocupadas obtenidas del iCal:", fechasOcupadas);
    console.log("✅ reservas.json actualizado correctamente");
    return fechasOcupadas;

  } catch (err) {
    console.error("❌ Error leyendo iCal de Booking:", err.message);
    return []; // devuelve vacío si falla
  }
}
