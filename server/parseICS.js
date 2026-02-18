// parseICS.js
export function parseICS(icsText) {
  const eventos = icsText.split("BEGIN:VEVENT");
  const fechasOcupadas = [];

  for (const evento of eventos) {
    const startMatch = evento.match(/DTSTART;VALUE=DATE:(\d{8})/);
    const endMatch = evento.match(/DTEND;VALUE=DATE:(\d{8})/);

    if (!startMatch || !endMatch) continue;

    const start = startMatch[1];
    const end = endMatch[1];

    // Convertimos a fechas reales
    const fechaInicio = new Date(
      start.substring(0, 4),
      start.substring(4, 6) - 1,
      start.substring(6, 8)
    );

    const fechaFin = new Date(
      end.substring(0, 4),
      end.substring(4, 6) - 1,
      end.substring(6, 8)
    );

    // Booking bloquea hasta el día anterior al checkout
    const actual = new Date(fechaInicio);

    while (actual < fechaFin) {
      const iso = actual.toISOString().split("T")[0];
      fechasOcupadas.push(iso);
      actual.setDate(actual.getDate() + 1);
    }
  }

  return fechasOcupadas;
}
