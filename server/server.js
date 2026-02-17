// server/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import { sincronizarReservas } from "./BookingSync.js";
import { calcularPrecio, fechasDisponibles } from "./pricing.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Archivo de reservas locales
const reservasFile = path.join(process.cwd(), "js", "reservas.json");

// ====== SINCRONIZAR RESERVAS DE BOOKING ======
let reservas = { campanilla: [], tejo: [] };

// Al iniciar servidor, sincronizamos
async function initReservas() {
  try {
    const data = await sincronizarReservas();
    reservas = data;
    fs.writeFileSync(reservasFile, JSON.stringify(reservas, null, 2));
    console.log("Reservas sincronizadas correctamente");
  } catch (err) {
    console.error("Error al sincronizar reservas:", err);
  }
}
initReservas();

// ====== ENDPOINTS ======

// Obtener todas las reservas (para calendario frontend)
app.get("/reservas", (req, res) => {
  res.json(reservas);
});

// Calcular precio
app.post("/calculate-price", (req, res) => {
  const { cabana, fechaInicio, fechaFin } = req.body;

  try {
    // Verificar disponibilidad
    if (!fechasDisponibles(cabana, fechaInicio, fechaFin)) {
      return res.status(400).json({ error: "Fechas no disponibles" });
    }

    const { total, descuento, noches } = calcularPrecio(cabana, fechaInicio, fechaFin);
    res.json({ total, descuento, noches });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Crear reserva (aquí conectarías pasarela de pago)
app.post("/create-payment", async (req, res) => {
  const { cabana, fechaInicio, fechaFin, nombre, telefono, nonce, amount } = req.body;

  try {
    // Validar disponibilidad
    if (!fechasDisponibles(cabana, fechaInicio, fechaFin)) {
      return res.status(400).json({ error: "Fechas no disponibles" });
    }

    // Actualizar reservas locales
    const fechaI = new Date(fechaInicio);
    const fechaF = new Date(fechaFin);
    let current = new Date(fechaI);
    while (current < fechaF) {
      reservas[cabana].push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    fs.writeFileSync(reservasFile, JSON.stringify(reservas, null, 2));

    // Aquí iría la lógica real de pago con Square u otra pasarela
    console.log(`Reserva confirmada: ${nombre} - ${cabana} (${fechaInicio} -> ${fechaFin})`);

    res.json({ success: true, message: "Reserva confirmada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando reserva" });
  }
});

// Servir archivos estáticos si quieres backend + frontend juntos
app.use(express.static(path.join(process.cwd(), "public")));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Cabañas Río Mundo escuchando en http://localhost:${PORT}`);
});
