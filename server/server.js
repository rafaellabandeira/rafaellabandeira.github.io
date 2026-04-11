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

async function leerReservas() {
  try {
    const res = await fetch(JSONBIN_URL, {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    return data.record;
  } catch(e) {
    console.error("Error leyendo reservas:", e);
    return { campanilla: [], tejo: [], bloqueados_campanilla: [], bloqueados_tejo: [] };
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

// GET reservas
app.get("/reservas", async (req, res) => {
  const reservas = await leerReservas();
  res.json(reservas);
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
