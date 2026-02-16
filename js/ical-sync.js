// === URL ICAL BOOKING CAMPANILLA ===
const ICAL_URL_CAMPANILLA = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// Aquí podrás añadir luego otro iCal para El Tejo
const ICAL_URL_TEJO = ""; // lo pondremos cuando tengas el otro


let fechasBloqueadas = {
  campanilla: [],
  tejo: []
};


// --- Cargar calendario ICAL ---
async function cargarICal(url, cabaña) {
  if (!url) return;

  const response = await fetch(url);
  const text = await response.text();

  const eventos = text.split("BEGIN:VEVENT");

  eventos.forEach(ev => {
    const inicio = ev.match(/DTSTART;VALUE=DATE:(\d+)/);
    const fin = ev.match(/DTEND;VALUE=DATE:(\d+)/);

    if (inicio && fin) {
      const fechaInicio = parseFechaICS(inicio[1]);
      const fechaFin = parseFechaICS(fin[1]);

      for (let d = new Date(fechaInicio); d < fechaFin; d.setDate(d.getDate() + 1)) {
        fechasBloqueadas[cabaña].push(formatearFecha(d));
      }
    }
  });

  console.log("Fechas bloqueadas cargadas:", cabaña, fechasBloqueadas[cabaña]);
}


function parseFechaICS(fecha) {
  const y = fecha.substring(0,4);
  const m = fecha.substring(4,6);
  const d = fecha.substring(6,8);
  return new Date(`${y}-${m}-${d}`);
}

function formatearFecha(date) {
  return date.toISOString().split("T")[0];
}


// --- Verificar disponibilidad ---
function fechaDisponible(cabaña, entrada, salida) {
  const ocupadas = fechasBloqueadas[cabaña];

  for (let d = new Date(entrada); d < new Date(salida); d.setDate(d.getDate() + 1)) {
    const f = formatearFecha(d);
    if (ocupadas.includes(f)) return false;
  }

  return true;
}


// --- Cargar calendarios al iniciar ---
window.addEventListener("load", async () => {
  await cargarICal(ICAL_URL_CAMPANILLA, "campanilla");
  await cargarICal(ICAL_URL_TEJO, "tejo");
});
// ical.sync.js
const express = require("express");
const axios = require("axios");
const ical = require("node-ical");
const cors = require("cors");

const app = express();
app.use(cors()); // Permite que tu frontend consulte este endpoint

// URL de tu iCal de Booking
const ICAL_URL = "https://ical.booking.com/v1/export?t=c30b7026-0047-476f-8439-7a91f6e06b87";

// Función para extraer fechas ocupadas del iCal
async function obtenerFechasOcupadas() {
  try {
    const response = await axios.get(ICAL_URL);
    const datos = ical.parseICS(response.data);

    const campanilla = [];
    const tejo = [];

    for (let k in datos) {
      const evento = datos[k];
      if (evento.type === "VEVENT") {
        const start = evento.start;
        const end = evento.end;

        // Iterar por cada día entre start y end
        for (
          let d = new Date(start);
          d < end;
          d.setDate(d.getDate() + 1)
        ) {
          const fecha = d.toISOString().split("T")[0]; // YYYY-MM-DD

          // Suponiendo que en el iCal hay "Campanilla" o "El Tejo" en SUMMARY
          if (evento.summary.toLowerCase().includes("campanilla")) {
            campanilla.push(fecha);
          } else if (evento.summary.toLowerCase().includes("tejo")) {
            tejo.push(fecha);
          }
        }
      }
    }

    return { campanilla, tejo };
  } catch (err) {
    console.error("Error leyendo iCal:", err);
    return { campanilla: [], tejo: [] };
  }
}

// Endpoint para el frontend
app.get("/reservas", async (req, res) => {
  const fechas = await obtenerFechasOcupadas();
  res.json(fechas);
});

// Puerto de Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iCal escuchando en puerto ${PORT}`));
