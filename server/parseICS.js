// parseICS.js
export function parseICS(icsText) {
  const eventos = icsText.split("BEGIN:VEVENT");
  const fechasOcupadas = [];

  for (const evento of eventos) {
    // Detecta ambos formatos de inicio y fin de evento
    const startMatch =
      evento.match(/DTSTART;VALUE=DATE:(\d{8})/) || 
      evento.match(/DTSTART;TZID=[^:]+:(\d{8})T\d{6}/);
    const endMatch =
      evento.match(/DTEND;VALUE=DATE:(\d{8})/) || 
      evento.match(/DTEND;TZID=[^:]+:(\d{8})T\d{6}/);

    if (!startMatch || !endMatch) continue;

    const start = startMatch[1];
    const end = endMatch[1];

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

    const actual = new Date(fechaInicio);

    // Bloquea desde la fecha de entrada hasta el día antes del checkout
    while (actual < fechaFin) {
      fechasOcupadas.push(actual.toISOString().split("T")[0]);
      actual.setDate(actual.getDate() + 1);
    }
  }

  console.log("📅 Fechas parseadas:", fechasOcupadas);
  return fechasOcupadas;
}
