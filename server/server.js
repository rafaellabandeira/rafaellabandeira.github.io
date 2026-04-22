// server/server.js
import express from "express";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "main")));

const JSONBIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

const ICAL_SOURCES = {
  campanilla: [
    "https://ical.booking.com/v1/export?t=e18611c6-57d5-4898-8671-b7af52ce0260",
    "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es"
  ],
  tejo: []
};

// ================================
// JSONBIN
// ================================

async function leerReservas() {
  try {
    const res = await fetch(JSONBIN_URL, {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    return data.record || {
      campanilla: [], tejo: [],
      bloqueados_campanilla: [], bloqueados_tejo: [],
      ical_campanilla: [], ical_tejo: []
    };
  } catch(e) {
    console.error("Error leyendo reservas:", e);
    return {
      campanilla: [], tejo: [],
      bloqueados_campanilla: [], bloqueados_tejo: [],
      ical_campanilla: [], ical_tejo: []
    };
  }
}

async function guardarReservas(reservas) {
  try {
    await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify(reservas)
    });
  } catch(e) {
    console.error("Error guardando reservas:", e);
  }
}

// ================================
// ICAL - PARSEAR
// ================================

function parsearFechasIcal(icalText) {
  const fechas = [];
  const eventos = icalText.split("BEGIN:VEVENT");

  for (const evento of eventos.slice(1)) {
    const dtstart = evento.match(/DTSTART[^:]*:(\d{8})/);
    const dtend = evento.match(/DTEND[^:]*:(\d{8})/);

    if (dtstart && dtend) {
      const inicio = dtstart[1];
      const fin = dtend[1];

      let actualStr = inicio;

      while (actualStr < fin) {
        const y = parseInt(actualStr.slice(0,4));
        const m = parseInt(actualStr.slice(4,6)) - 1;
        const d = parseInt(actualStr.slice(6,8));
        const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (!fechas.includes(iso)) fechas.push(iso);

        const next = new Date(y, m, d + 1);
        actualStr = `${next.getFullYear()}${String(next.getMonth()+1).padStart(2,'0')}${String(next.getDate()).padStart(2,'0')}`;
      }
    }
  }
  return fechas;
}

// ================================
// ICAL - EXPORTAR
// ================================

function generarIcal(cabana, bloqueos) {
  const nombre = cabana === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
  let ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cabañas Río Mundo//ES",
    `X-WR-CALNAME:${nombre}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  for (const fecha of bloqueos) {
    const dtstart = fecha.replace(/-/g, "");
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fechaFin.getDate() + 1);
    const dtend = fechaFin.toISOString().slice(0,10).replace(/-/g, "");
    const uid = `${dtstart}-${cabana}@casaruralriomundo.es`;

    ical = ical.concat([
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      "SUMMARY:No disponible",
      "END:VEVENT"
    ]);
  }

  ical.push("END:VCALENDAR");
  return ical.join("\r\n");
}

// ================================
// ICAL - IMPORTAR DESDE EXTERNOS
// ================================

async function sincronizarIcalExterno(cabana) {
  const urls = ICAL_SOURCES[cabana];
  if (!urls || urls.length === 0) return;

  let reservas = await leerReservas();
  if (!reservas) reservas = {
    campanilla: [], tejo: [],
    bloqueados_campanilla: [], bloqueados_tejo: [],
    ical_campanilla: [], ical_tejo: []
  };

  let nuevasFechas = [];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const texto = await res.text();
      const fechas = parsearFechasIcal(texto);
      nuevasFechas = nuevasFechas.concat(fechas);
    } catch(e) {
      console.error(`Error importando iCal de ${cabana}:`, e);
    }
  }

  // ✅ Sobreescribir en lugar de acumular — evita días de salida repetidos
  reservas[`ical_${cabana}`] = nuevasFechas;
  await guardarReservas(reservas);
  console.log(`Sincronizados ${nuevasFechas.length} días para ${cabana}`);
}

async function sincronizarTodo() {
  await sincronizarIcalExterno("campanilla");
  await sincronizarIcalExterno("tejo");
}

sincronizarTodo();
setInterval(sincronizarTodo, 6 * 60 * 60 * 1000);

// ================================
// ENDPOINTS
// ================================

// GET reservas — combina manuales + iCal para el frontend
app.get("/reservas", async (req, res) => {
  const reservas = await leerReservas();

  // El frontend recibe los bloqueos manuales e iCal combinados
  const resultado = {
    campanilla: reservas.campanilla || [],
    tejo: reservas.tejo || [],
    bloqueados_campanilla: [
      ...(reservas.bloqueados_campanilla || []),
      ...(reservas.ical_campanilla || [])
    ],
    bloqueados_tejo: [
      ...(reservas.bloqueados_tejo || []),
      ...(reservas.ical_tejo || [])
    ]
  };

  res.json(resultado);
});

// POST bloquear día (por cabaña)
app.post("/reservas", async (req, res) => {
  const { fecha, cabana, cabaña } = req.body;
  const cab = cabana || cabaña;
  if (!fecha || !cab) return res.status(400).json({ ok: false, msg: "Falta fecha o cabaña" });

  const reservas = await leerReservas();
  const campo = `bloqueados_${cab}`;

  if (!reservas[campo]) reservas[campo] = [];
  if (!reservas[campo].includes(fecha)) {
    reservas[campo].push(fecha);
    await guardarReservas(reservas);
  }
  res.json({ ok: true });
});

// DELETE desbloquear día (por cabaña)
app.delete("/reservas", async (req, res) => {
  const { fecha, cabana, cabaña } = req.body;
  const cab = cabana || cabaña;
  if (!fecha || !cab) return res.status(400).json({ ok: false, msg: "Falta fecha o cabaña" });

  const reservas = await leerReservas();
  const campo = `bloqueados_${cab}`;

  if (reservas[campo]) {
    reservas[campo] = reservas[campo].filter(f => f !== fecha);
    await guardarReservas(reservas);
  }
  res.json({ ok: true });
});

// GET exportar iCal por cabaña
app.get("/calendario/:cabana.ics", async (req, res) => {
  const cabana = req.params.cabana;
  if (!["campanilla", "tejo"].includes(cabana)) {
    return res.status(404).send("Cabaña no encontrada");
  }

  const reservas = await leerReservas();
  const bloqueos = [
    ...(reservas[cabana] || []),
    ...(reservas[`bloqueados_${cabana}`] || []),
    ...(reservas[`ical_${cabana}`] || [])
  ];

  const ical = generarIcal(cabana, [...new Set(bloqueos)]);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${cabana}.ics"`);
  res.send(ical);
});

// POST sincronizar manualmente
app.post("/sincronizar", async (req, res) => {
  await sincronizarTodo();
  res.json({ ok: true, msg: "Sincronización completada" });
});

// Verificar contraseña de administrador
app.post("/admin/verificar", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
