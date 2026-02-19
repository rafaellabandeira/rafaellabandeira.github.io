export function parseICS(icsText) {
  const eventos = icsText.split("BEGIN:VEVENT");
  const fechasOcupadas = [];

  for (const evento of eventos) {
    const startMatch = evento.match(/DTSTART;VALUE=DATE:(\d{8})/);
    const endMatch = evento.match(/DTEND;VALUE=DATE:(\d{8})/);

    if (!startMatch || !endMatch) continue;

    const start = startMatch[1];
    const end = endMatch[1];

    const fechaInicio = new Date(
      Number(start.substring(0, 4)),
      Number(start.substring(4, 6)) - 1,
      Number(start.substring(6, 8)),
      12, 0, 0 // 🔴 evitar saltos por zona horaria
    );

    const fechaFin = new Date(
      Number(end.substring(0, 4)),
      Number(end.substring(4, 6)) - 1,
      Number(end.substring(6, 8)),
      12, 0, 0
    );

    const actual = new Date(fechaInicio);

    // Booking deja libre el checkout → NO bloqueamos el último día
    while (actual < fechaFin) {
      fechasOcupadas.push(formatearFechaLocal(actual));
      actual.setDate(actual.getDate() + 1);
    }
  }

  return fechasOcupadas;
}

/* ✅ Formato YYYY-MM-DD en LOCAL (NO UTC) */
function formatearFechaLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
