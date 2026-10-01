// server/server.js
import express from "express";
import path from "path";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.set("trust proxy", 1); // Render va detrás de un proxy (necesario para ver la IP real)
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(process.cwd(), "main")));

const JSONBIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

const CABANAS = ["campanilla", "tejo"];

// Los enlaces iCal llevan un token privado: van en variables de entorno de Render,
// NO en el código. Varios enlaces se separan con comas.
function leerEnlaces(nombreVariable) {
  return (process.env[nombreVariable] || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}
const ICAL_SOURCES = {
  campanilla: leerEnlaces("ICAL_CAMPANILLA"),
  tejo: leerEnlaces("ICAL_TEJO")
};
if (ICAL_SOURCES.campanilla.length === 0) {
  console.warn("AVISO: falta la variable ICAL_CAMPANILLA, no se sincronizará Booking/Airbnb.");
}

// ================================
// SEGURIDAD
// ================================

function passwordCorrecta(candidata) {
  const real = process.env.ADMIN_PASSWORD || "";
  if (!real || typeof candidata !== "string") return false;
  const a = crypto.createHash("sha256").update(candidata).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

// Middleware: exige la contraseña de admin en la cabecera x-admin-password
function requireAdmin(req, res, next) {
  if (!passwordCorrecta(req.get("x-admin-password"))) {
    return res.status(401).json({ ok: false, msg: "No autorizado" });
  }
  next();
}

// Límite de intentos de contraseña: 5 fallos cada 15 minutos por IP
const intentos = new Map();
function limitarIntentos(req, res, next) {
  const ip = req.ip;
  const ahora = Date.now();
  const reg = intentos.get(ip);
  if (reg && ahora < reg.hasta && reg.fallos >= 5) {
    return res.status(429).json({ ok: false, msg: "Demasiados intentos. Prueba más tarde." });
  }
  req.registrarFallo = () => {
    const r = intentos.get(ip);
    if (!r || ahora >= r.hasta) intentos.set(ip, { fallos: 1, hasta: ahora + 15 * 60 * 1000 });
    else r.fallos++;
  };
  req.limpiarFallos = () => intentos.delete(ip);
  next();
}

function datosValidos(fecha, cab) {
  return typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && CABANAS.includes(cab);
}

// ================================
// JSONBIN
// ================================

const VACIO = () => ({
  campanilla: [], tejo: [],
  bloqueados_campanilla: [], bloqueados_tejo: [],
  ical_campanilla: [], ical_tejo: []
});

// Si falla la lectura LANZA error (antes devolvía datos vacíos, y un guardado
// posterior habría borrado todas las reservas).
async function leerReservas() {
  const res = await fetch(JSONBIN_URL, { headers: { "X-Master-Key": JSONBIN_KEY } });
  if (!res.ok) throw new Error(`JSONBin lectura HTTP ${res.status}`);
  const data = await res.json();
  return { ...VACIO(), ...(data.record || {}) };
}

async function guardarReservas(reservas) {
  const res = await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY },
    body: JSON.stringify(reservas)
  });
  if (!res.ok) throw new Error(`JSONBin escritura HTTP ${res.status}`);
}

// Cola de escritura: evita que dos cambios simultáneos (p. ej. una sincronización
// y un bloqueo) se pisen entre sí.
let cola = Promise.resolve();
function enCola(tarea) {
  const p = cola.then(tarea);
  cola = p.catch(() => {});
  return p;
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
      let actualStr = dtstart[1];
      const finStr = dtend[1];

      while (actualStr < finStr) {
        const iso = `${actualStr.slice(0,4)}-${actualStr.slice(4,6)}-${actualStr.slice(6,8)}`;
        if (!fechas.includes(iso)) fechas.push(iso);

        // Avanzar un día sin usar Date para evitar problemas de zona horaria
        const y = parseInt(actualStr.slice(0,4));
        const m = parseInt(actualStr.slice(4,6));
        const d = parseInt(actualStr.slice(6,8));

        const diasPorMes = [0,31,28,31,30,31,30,31,31,30,31,30,31];
        const esBisiesto = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
        if (esBisiesto) diasPorMes[2] = 29;

        let nd = d + 1, nm = m, ny = y;
        if (nd > diasPorMes[m]) { nd = 1; nm++; }
        if (nm > 12) { nm = 1; ny++; }

        actualStr = `${ny}${String(nm).padStart(2,'0')}${String(nd).padStart(2,'0')}`;
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
    const y = parseInt(fecha.slice(0,4));
    const m = parseInt(fecha.slice(5,7));
    const d = parseInt(fecha.slice(8,10));

    const diasPorMes = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    const esBisiesto = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (esBisiesto) diasPorMes[2] = 29;

    let nd = d + 1, nm = m, ny = y;
    if (nd > diasPorMes[m]) { nd = 1; nm++; }
    if (nm > 12) { nm = 1; ny++; }

    const dtend = `${ny}${String(nm).padStart(2,'0')}${String(nd).padStart(2,'0')}`;
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

// Si CUALQUIER enlace falla, no se toca nada y se conservan las fechas anteriores
// (antes un fallo de Booking/Airbnb dejaba el calendario vacío = todo libre).
async function sincronizarIcalExterno(cabana) {
  const urls = ICAL_SOURCES[cabana];
  if (!urls || urls.length === 0) return;

  let nuevasFechas = [];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const texto = await res.text();
    if (!texto.includes("BEGIN:VCALENDAR")) throw new Error("Respuesta iCal no válida");
    nuevasFechas = nuevasFechas.concat(parsearFechasIcal(texto));
  }
  nuevasFechas = [...new Set(nuevasFechas)];

  await enCola(async () => {
    const reservas = await leerReservas();
    reservas[`ical_${cabana}`] = nuevasFechas;
    await guardarReservas(reservas);
  });
  console.log(`Sincronizados ${nuevasFechas.length} días para ${cabana}`);
}

async function sincronizarTodo() {
  for (const cabana of CABANAS) {
    try {
      await sincronizarIcalExterno(cabana);
    } catch (e) {
      console.error(`Error sincronizando ${cabana} (se conservan las fechas anteriores):`, e.message);
    }
  }
}

sincronizarTodo();
setInterval(sincronizarTodo, 6 * 60 * 60 * 1000);

// ================================
// ENDPOINTS
// ================================

app.get("/reservas", async (req, res) => {
  try {
    const reservas = await leerReservas();
    res.json({
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
    });
  } catch (e) {
    console.error("Error leyendo reservas:", e.message);
    res.status(503).json({ ok: false, msg: "No se pudieron cargar las reservas" });
  }
});

app.post("/reservas", requireAdmin, async (req, res) => {
  const { fecha, cabana, cabaña } = req.body;
  const cab = cabana || cabaña;
  if (!datosValidos(fecha, cab)) return res.status(400).json({ ok: false, msg: "Fecha o cabaña no válidas" });

  try {
    await enCola(async () => {
      const reservas = await leerReservas();
      const campo = `bloqueados_${cab}`;
      if (!reservas[campo]) reservas[campo] = [];
      if (!reservas[campo].includes(fecha)) {
        reservas[campo].push(fecha);
        await guardarReservas(reservas);
      }
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e.message);
    res.status(503).json({ ok: false, msg: "No se pudo guardar" });
  }
});

app.delete("/reservas", requireAdmin, async (req, res) => {
  const { fecha, cabana, cabaña } = req.body;
  const cab = cabana || cabaña;
  if (!datosValidos(fecha, cab)) return res.status(400).json({ ok: false, msg: "Fecha o cabaña no válidas" });

  try {
    await enCola(async () => {
      const reservas = await leerReservas();
      const campo = `bloqueados_${cab}`;
      if (reservas[campo]) {
        reservas[campo] = reservas[campo].filter(f => f !== fecha);
        await guardarReservas(reservas);
      }
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e.message);
    res.status(503).json({ ok: false, msg: "No se pudo guardar" });
  }
});

app.get("/calendario/:cabana.ics", async (req, res) => {
  const cabana = req.params.cabana;
  if (!CABANAS.includes(cabana)) {
    return res.status(404).send("Cabaña no encontrada");
  }

  try {
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
  } catch (e) {
    console.error(e.message);
    res.status(503).send("Calendario no disponible");
  }
});

app.post("/sincronizar", requireAdmin, async (req, res) => {
  await sincronizarTodo();
  res.json({ ok: true, msg: "Sincronización completada" });
});

app.post("/admin/verificar", limitarIntentos, (req, res) => {
  const { password } = req.body || {};
  if (passwordCorrecta(password)) {
    req.limpiarFallos();
    res.json({ ok: true });
  } else {
    req.registrarFallo();
    res.status(401).json({ ok: false });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
