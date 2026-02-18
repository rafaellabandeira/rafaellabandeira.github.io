import https from "https";
import fs from "fs";
import path from "path";
import { parseICS } from "./parseICS.js";

const filePath = path.join(process.cwd(), "reservas.json");

// ✅ TU ICAL DE CAMPANILLA
const ICAL_CAMPANILLA =
  "https://ical.booking.com/v1export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// 👉 cuando tengas el del Tejo lo pegas aquí
const ICAL_TEJO = null;

function descargarICS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

export async function sincronizarBooking() {
  try {
    console.log("Sincronizando Booking…");

    const icsCampanilla = await descargarICS(ICAL_CAMPANILLA);
    const campanilla = parseICS(icsCampanilla);

    let tejo = [];
    if (ICAL_TEJO) {
      const icsTejo = await descargarICS(ICAL_TEJO);
      tejo = parseICS(icsTejo);
    }

    const reservas = { campanilla, tejo };

    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));

    console.log("reservas.json actualizado correctamente");
  } catch (err) {
    console.error("Error sincronizando Booking:", err);
  }
}
