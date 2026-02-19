import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

// 🔹 Ruta segura absoluta en Render
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");

// 🔹 iCal Booking Campanilla
const ICAL_CAMPANILLA = "https://ical.booking.com/v1/export?t=a9688215-118d-43be-8a19-da58f26ed9ee";

// 🔹 iCal El Tejo (añádelo cuando lo tengas)
const ICAL_TEJO = null;

// 🔹 Función para descargar ICS usando https nativo
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";

      res.on("data", chunk => (data += chunk));

      res.on("end", () => {
        if (data.length === 0) {
          console.warn("⚠️ ICS descargado vacío:", url);
        } else {
          console.log(`✅ ICS descargado, ${data.length} caracteres`);
        }
        resolve(data);
      });

    }).on("error", err => {
      console.error("❌ Error descargando ICS:", err);
      reject(err);
    });
  });
}

// 🔹 Sincroniza Booking y guarda reservas.json
export async function sincronizarBooking() {
  try {
    console.log("🔄 Sincronizando Booking…");

    // --- DESCARGA CAMPANILLA ---
    const icsCampanilla = await descargarICS(ICAL_CAMPANILLA);
    const campanilla = parseICS(icsCampanilla);
    console.log("📅 Fechas Campanilla parseadas:", campanilla);

    // --- EL TEJO ---
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = parseICS(icsTejo);
      console.log("📅 Fechas Tejo parseadas:", tejo);
    }

    // Guardamos todas las reservas
    const reservas = { campanilla, tejo };

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));
    console.log("💾 reservas.json actualizado correctamente");

    // ✅ Comprobación final
    const contenido = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log("🔍 Contenido actual de reservas.json:", contenido);

  } catch (err) {
    console.error("❌ Error sincronizando Booking:", err);
  }
}
