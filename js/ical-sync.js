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
