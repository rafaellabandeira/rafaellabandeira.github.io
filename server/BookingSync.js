// BookingSync.js
import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

// 🔹 Ruta segura para Render
const filePath = path.join(process.cwd(), "reservas.json");

// 🔹 iCal Booking Campanilla
const ICAL_CAMPANILLA = "https://ical.booking.com/v1export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// 🔹 iCal El Tejo (añádelo cuando lo tengas)
const ICAL_TEJO = null;

// 🔹 Función para descargar ICS usando https nativo
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";

      res.on("data", chunk => (data += chunk));

      res.on("end", () => resolve(data));

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
    console.log("📥 ICS Campanilla descargado, tamaño:", icsCampanilla.length);
    console.log("📄 Inicio ICS:", icsCampanilla.slice(0, 120));

    const campanilla = parseICS(icsCampanilla);
    console.log("📅 Fechas Campanilla parseadas:", campanilla);

    // --- EL TEJO ---
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      console.log("📥 ICS Tejo descargado, tamaño:", icsTejo.length);
      tejo = parseICS(icsTejo);
      console.log("📅 Fechas Tejo parseadas:", tejo);
    }

    const reservas = { campanilla, tejo };
    console.log("💾 Guardando reservas en:", filePath);

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));
    console.log("✅ reservas.json actualizado correctamente");

  } catch (err) {
    console.error("❌ Error sincronizando Booking:", err);
  }
}
