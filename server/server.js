// server/server.js
import express from "express";
import cors from "cors";
import { sincronizarReservas } from "./BookingSync.js";

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint para devolver reservas de Campanilla
app.get("/reservas", async (req, res) => {
  const fechasOcupadas = await sincronizarReservas();
  res.json({ campanilla: fechasOcupadas });
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
