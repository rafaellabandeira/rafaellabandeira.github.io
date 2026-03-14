import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

// 📍 Ruta correcta en Render (disco temporal escribible)
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");

// 🔹 iCal AIRBNB Campanilla → calendario madre
const ICAL_AIRBNB_CAMPANILLA =
  "https://www.airbnb.es/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3";

// 🔹 iCal AIRBNB El Tejo (cuando lo tengas)
const ICAL_AIRBNB_TEJO = null;


// --------------------------------------------------
// DESCARGAR ICS
// --------------------------------------------------
function descargarICS(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve(null);
      return;
    }

    https.get(url, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`✅ ICS descargado (${url}) → ${data.length} chars`);
        resolve(data);
      });
    }).on("error", reject);
  });
}


// --------------------------------------------------
// 🔧 FIX IMPORTANTE → Render usa UTC
// Airbnb exporta fechas que pueden desplazarse 1 día
// --------------------------------------------------
function corregirZonaHoraria(fechas) {
  const offset = new Date().getTimezoneOffset();

  if (offset === 0) {
    console.log("🌍 Servidor en UTC → corrigiendo fechas…");

    return fechas.map(f => {
      const d = new Date(f);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    });
  }

  return fechas;
}


// --------------------------------------------------
// Eliminar duplicados y ordenar
// --------------------------------------------------
function limpiarFechas(fechas) {
  return [...new Set(fechas)].sort();
}


// --------------------------------------------------
// SINCRONIZACIÓN TOTAL
// --------------------------------------------------
export async function sincronizarBooking() {
  try {
    console.log("🔄 Sincronizando calendarios de Airbnb…");

    // -------- CAMPANILLA (AIRBNB = CALENDARIO MADRE) --------
    let campanilla = [];

    const icsAirbnbCampanilla = await descargarICS(ICAL_AIRBNB_CAMPANILLA);
    if (icsAirbnbCampanilla) {
      campanilla = parseICS(icsAirbnbCampanilla);
      campanilla = corregirZonaHoraria(campanilla);
      campanilla = limpiarFechas(campanilla);
    }

    console.log("📅 Airbnb Campanilla:", campanilla.length);

    // -------- TEJO --------
    let tejo = [];
    if (ICAL_AIRBNB_TEJO) {
      const icsTejo = await descargarICS(ICAL_AIRBNB_TEJO);
      if (icsTejo) {
        tejo = parseICS(icsTejo);
        tejo = corregirZonaHoraria(tejo);
        tejo = limpiarFechas(tejo);
      }
    }

    console.log("📅 Airbnb Tejo:", tejo.length);

    const reservas = { campanilla, tejo };

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("💾 reservas.json guardado en:", filePath);
    console.log("📊 Total Campanilla:", campanilla.length);
    console.log("📊 Total Tejo:", tejo.length);

  } catch (err) {
    console.error("❌ Error sincronizando:", err);
  }
}


// --------------------------------------------------
// 🔧 FIX IMPORTANTE → Render usa UTC
// Booking/Airbnb exportan fechas en LOCAL
// Esto corrige el desplazamiento de 1 día
// --------------------------------------------------
function corregirZonaHoraria(fechas) {
  const offset = new Date().getTimezoneOffset();

  // Si el servidor está en UTC (Render = 0)
  if (offset === 0) {
    console.log("🌍 Servidor en UTC → corrigiendo fechas…");

    return fechas.map(f => {
      const d = new Date(f);
      d.setDate(d.getDate() - 1); // ← CLAVE del bug que tenías
      return d.toISOString().split("T")[0];
    });
  }

  return fechas;
}


// --------------------------------------------------
// Eliminar duplicados y ordenar
// --------------------------------------------------
function limpiarFechas(fechas) {
  return [...new Set(fechas)].sort();
}


// --------------------------------------------------
// SINCRONIZACIÓN TOTAL
// --------------------------------------------------
export async function sincronizarBooking() {
  try {
    console.log("🔄 Sincronizando calendarios…");

    // -------- BOOKING --------
    const icsBooking = await descargarICS(ICAL_CAMPANILLA);
    let campanillaBooking = parseICS(icsBooking);

    // -------- AIRBNB --------
    const icsAirbnb = await descargarICS(ICAL_AIRBNB);
    let campanillaAirbnb = parseICS(icsAirbnb);

    console.log("📅 Booking:", campanillaBooking.length);
    console.log("📅 Airbnb:", campanillaAirbnb.length);

    // 🔥 UNIMOS ambos calendarios
    let campanilla = [
      ...campanillaBooking,
      ...campanillaAirbnb
    ];

    // 🔧 corregimos bug de Render UTC
    campanilla = corregirZonaHoraria(campanilla);

    // limpiamos duplicados
    campanilla = limpiarFechas(campanilla);

    // -------- TEJO --------
    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = limpiarFechas(corregirZonaHoraria(parseICS(icsTejo)));
    }

    const reservas = { campanilla, tejo };

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("💾 reservas.json guardado en:", filePath);
    console.log("📊 Total Campanilla:", campanilla.length);

  } catch (err) {
    console.error("❌ Error sincronizando:", err);
  }
}
