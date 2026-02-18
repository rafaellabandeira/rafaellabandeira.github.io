export function parseICS(icsText) {
  const eventos = icsText.split("BEGIN:VEVENT");
  const fechas = [];

  eventos.forEach(ev => {
    const start = ev.match(/DTSTART;VALUE=DATE:(\d+)/);
    const end = ev.match(/DTEND;VALUE=DATE:(\d+)/);

    if (!start || !end) return;

    let actual = formatear(start[1]);
    const salida = formatear(end[1]);

    // Booking bloquea hasta el día anterior de salida
    while (actual < salida) {
      fechas.push(actual);
      actual = sumarDia(actual);
    }
  });

  return fechas;
}

function formatear(fecha) {
  return `${fecha.slice(0,4)}-${fecha.slice(4,6)}-${fecha.slice(6,8)}`;
}

function sumarDia(fecha) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0,10);
}
