import fs from "fs";
import path from "path";
import ical from "node-ical";
import fetch from "node-fetch";

const __dirname = process.cwd(); // 🔴 importante en Render
const filePath = path.join(__dirname, "reservas.json");

// 👉 PON AQUÍ TU ICAL DE BOOKING
const ICAL_URL = "TU_URL_ICAL_DE_BOOKING";

export async function sincronizarReservas() {
  try {
    console.log("🔄 Sincronizando con Booking…");

    const response = await fetch(ICAL_URL);
    const data = await response.text();

    const eventos = ical.parseICS(data);

    const fechas = [];

    for (const k in eventos) {
      const ev = eventos[k];
      if (ev.type === "VEVENT") {
        let actual = new Date(ev.start);
        const fin = new Date(ev.end);

        while (actual < fin) {
          fechas.push(actual.toISOString().split("T")[0]);
          actual.setDate(actual.getDate() + 1);
        }
      }
    }

    const resultado = {
      campanilla: fechas,
      tejo: [] // luego podremos separar
    };

    fs.writeFileSync(filePath, JSON.stringify(resultado, null, 2));

    console.log("✅ reservas.json actualizado:", resultado.campanilla.length, "fechas");

  } catch (err) {
    console.error("❌ Error sincronizando:", err);
  }
}
