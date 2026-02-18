import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

/* 📍 Ruta segura donde Render puede escribir */
const filePath = path.resolve("./reservas.json");

// 🔹 iCal Booking Campanilla
const ICAL_CAMPANILLA = "https://ical.booking.com/v1export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// 🔹 iCal El Tejo (si lo tienes)
const ICAL_TEJO = null;

/* 🔹 Descargar ICS usando https con cabeceras de navegador */
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/calendar",
        "Connection": "keep-alive"
      }
    };

    https.get(url, options, res => {
      let data = "";

      res.on("data", chunk => { data += chunk; });

      res.on("end", () => { resolve(data); });

    }).on("error", err => reject(err));
  });
}

/* 🔹 Sincroniza Booking y guarda reservas.json */
export async function sincronizarBooking() {
  try {
    console.log("🔄 Iniciando sincronización con Booking…");

    // --- Campanilla
    const icsCampanilla = await descargarICS(ICAL_CAMPANILLA);

    console.log("📥 ICS Campanilla descargado, tamaño:", icsCampanilla.length);
    if (!icsCampanilla || icsCampanilla.length === 0) {
      console.warn("⚠️ Aviso: ICS de Campanilla vacío. Verifica el enlace.");
    }

    const campanilla = parseICS(icsCampanilla);
    console.log("📅 Fechas detectadas Campanilla:", campanilla.length);

    // --- El Tejo
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = parseICS(icsTejo);
      console.log("📅 Fechas detectadas Tejo:", tejo.length);
    }

    const reservas = { campanilla, tejo };

    console.log("💾 Guardando reservas en:", filePath);
    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("✅ reservas.json actualizado correctamente");
  } catch (err) {
    console.error("❌ Error sincronizando Booking:", err);
  }
}
