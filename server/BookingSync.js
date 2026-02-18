// src/BookingSync.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { parseICS } from "./parseICS.js"; // función para parsear iCal, la puedes tener

const filePath = path.join(process.cwd(), "reservas.json");

const URL_ICAL_CAMPANILLA = "TU_URL_ICAL_CAMPANILLA";
const URL_ICAL_TEJO = "TU_URL_ICAL_TEJO";

export async function sincronizarBooking() {
  try {
    const [resCampanilla, resTejo] = await Promise.all([
      fetch(URL_ICAL_CAMPANILLA),
      fetch(URL_ICAL_TEJO)
    ]);

    const icsCampanilla = await resCampanilla.text();
    const icsTejo = await resTejo.text();

    const campanilla = parseICS(icsCampanilla); // devuelve array de fechas ocupadas
    const tejo = parseICS(icsTejo);

    const reservas = { campanilla, tejo };
    fs.writeFileSync(filePath, JSON.stringify(reservas, null, 2));
    console.log("✅ reservas.json actualizado desde Booking");
  } catch (err) {
    console.error("Error sincronizando Booking:", err);
  }
}
