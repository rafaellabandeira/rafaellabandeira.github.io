import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

/* 📍 Ruta REAL donde Render puede escribir */
const filePath = path.resolve("./reservas.json");

// 🔹 iCal Booking Campanilla
const ICAL_CAMPANILLA = "https://ical.booking.com/v1export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// 🔹 iCal El Tejo (añádelo cuando lo tengas)
const ICAL_TEJO = null;

/* 🔹 Descargar ICS usando https nativo (sin node-fetch) */
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";

      res.on("data", chunk => (data += chunk));

      res.on("end", () => {
        resolve(data);
      });

    }).on("error", reject);
  });
}

/* 🔹 Sincroniza Booking y guarda reservas.json */
export async function sincronizarBooking() {
  try {
    console.log("🔄 Sincronizando Booking…");

    /* --- DESCARGA CAMPANILLA --- */
    const icsCampanilla = await descargarICS(ICAL_CAMPANILLA);

    console.log("📥 ICS descargado, tamaño:", icsCampanilla.length);
    console.log("📄 Inicio ICS:");
    console.log(icsCampanilla.slice(0, 120)); // ver si es calendario real

    const campanilla = parseICS(icsCampanilla);
    console.log("📅 Fechas detectadas Campanilla:", campanilla.length);

    /* --- EL TEJO (si existe) --- */
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = parseICS(icsTejo);
      console.log("📅 Fechas detectadas Tejo:", tejo.length);
    }

    const reservas = { campanilla, tejo };

    console.log("💾 Guardando en:", filePath);

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("✅ reservas.json actualizado correctamente");

  } catch (err) {
    console.error("❌ Error sincronizando Booking:", err);
  }
}
