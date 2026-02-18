import express from "express";
import cors from "cors";
import { sincronizarBooking } from "./BookingSync.js";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const filePath = path.join(process.cwd(), "reservas.json");

// 🔹 sincroniza al arrancar
await sincronizarBooking();

// 🔹 endpoint que usa tu web
app.get("/reservas", (req, res) => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch {
    res.json({ campanilla: [], tejo: [] });
  }
});

app.listen(PORT, () => console.log("Servidor activo"));
