// server/server.js
import express from "express";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Carpeta main con index.html, main.js y CSS
app.use(express.static(path.join(process.cwd(), "main")));

// 🔹 Configuración JSONBin
const JSONBIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;

// 🔹 Leer reservas desde JSONBin
async function leerReservas() {
  try {
    const res = await fetch(JSONBIN_URL, {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    return data.record;
  } catch(e) {
    console.error("Error leyendo reservas:", e);
    return { campanilla: [], tejo: [], bloqueados: [] };
  }
}

// 🔹 Guardar reservas en JSONBin
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

// 🔹 GET reservas
app.get("/reservas", async (req, res) => {
  const reservas = await leerReservas();
  res.json(reservas);
});

// 🔹 POST bloquear día
app.post("/reservas", async (req, res) => {
  const { fecha } = req.body;
  if (!fecha) return res.status(400).json({ ok: false, msg: "Falta fecha" });

  const reservas = await leerReservas();
  if (!reservas.bloqueados.includes(fecha)) {
    reservas.bloqueados.push(fecha);
    await guardarReservas(reservas);
  }
  res.json({ ok: true });
});

// 🔹 DELETE desbloquear día
app.delete("/reservas", async (req, res) => {
  const { fecha } = req.body;
  if (!fecha) return res.status(400).json({ ok: false, msg: "Falta fecha" });

  const reservas = await leerReservas();
  reservas.bloqueados = reservas.bloqueados.filter(f => f !== fecha);
  await guardarReservas(reservas);
  res.json({ ok: true });
});

// 🔹 Verificar contraseña de administrador
app.post("/admin/verificar", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

// 🔹 Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
