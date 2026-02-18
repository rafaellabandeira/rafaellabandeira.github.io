import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { sincronizarBooking } from "./BookingSync.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const filePath = path.join(process.cwd(), "reservas.json");

// 🔹 endpoint que devuelve reservas
app.get("/reservas", (req, res) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch {
    res.json({ campanilla: [], tejo: [] });
  }
});

// 🔹 función async que inicia servidor después de sincronizar Booking
async function iniciarServidor() {
  try {
    await sincronizarBooking(); // tu lógica de BookingSync intacta

    app.listen(PORT, () => {
      console.log(`Servidor activo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("Error iniciando servidor:", err);
    process.exit(1); // Render marcará error si falla Booking
  }
}

iniciarServidor();
