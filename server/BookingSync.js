// server/BookingSync.js
import ical from "node-ical";
import axios from "axios";

// URL iCal de Booking (la que me diste)
const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// Función para leer y parsear el iCal
export async function getBookingDates() {
  try {
    // Descargamos el iCal
    const response = await axios.get(ICAL_URL);
    const data = ical.parseICS(response.data);

    // Array donde vamos a guardar las fechas ocupadas
    const fechasOcupadas = [];

    // Recorremos todos los eventos del iCal
    for (const key in data) {
      if (data[key].type === "VEVENT") {
        const start = data[key].start.toISOString().split("T")[0];
        const end = data[key].end.toISOString().split("T")[0];

        // Generar todas las fechas entre start y end
        let current = new Date(start);
        const endDate = new Date(end);

        while (current < endDate) {
          fechasOcupadas.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    console.log("Fechas ocupadas obtenidas del iCal:", fechasOcupadas);
    return fechasOcupadas;

  } catch (err) {
    console.error("Error leyendo iCal de Booking:", err.message);
    return []; // devuelve vacío si falla
  }
}
