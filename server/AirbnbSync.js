// AirbnbSync.js
import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

// 📍 Ruta segura en Render para el JSON
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");

// 🔹 iCal Airbnb Campanilla
const ICAL_AIRBNB =
  "https://www.airbnb.es/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3";

// 🔹 El Tejo (si lo añades después)
const ICAL_TEJO = null;

// --------------------------------------------------
// DESCARGAR ICS
// --------------------------------------------------
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        console.log(`✅ ICS descargado (${url}) → ${data.length} chars`);
        resolve(data);
      });
    }).on("error", reject);
  });
}

// --------------------------------------------------
// CORREGIR DESPLAZAMIENTO UTC Render
// --------------------------------------------------
function corregirZonaHoraria(fechas) {
  const offset = new Date().getTimezoneOffset();
  if (offset === 0) {
    console.log("🌍 Servidor en UTC → corrigiendo fechas…");
    return fechas.map(f => {
      const d = new Date(f);
      d.setDate(d.getDate() - 1); // Corrige desfase 1 día
      return d.toISOString().split("T")[0];
    });
  }
  return fechas;
}

// --------------------------------------------------
// ELIMINAR DUPLICADOS Y ORDENAR
// --------------------------------------------------
function limpiarFechas(fechas) {
  return [...new Set(fechas)].sort();
}

// --------------------------------------------------
// SINCRONIZACIÓN Airbnb
// --------------------------------------------------
export async function sincronizarAirbnb() {
  try {
    console.log("🔄 Sincronizando calendario Airbnb…");

    // -------- CAMPANILLA --------
    const icsAirbnb = await descargarICS(ICAL_AIRBNB);
    let campanilla = parseICS(icsAirbnb);
    campanilla = corregirZonaHoraria(campanilla);
    campanilla = limpiarFechas(campanilla);

    // -------- TEJO --------
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = limpiarFechas(corregirZonaHoraria(parseICS(icsTejo)));
    }

    // Guardar JSON
    const reservas = { campanilla, tejo };
    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("💾 reservas.json guardado en:", filePath);
    console.log("📊 Total Campanilla:", campanilla.length);

  } catch (err) {
    console.error("❌ Error sincronizando Airbnb:", err);
  }
}
