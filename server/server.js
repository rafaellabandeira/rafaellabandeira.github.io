import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { sincronizarBooking } from "./BookingSync.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// 🔹 Ruta absoluta segura en Render
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");
console.log("📂 Archivo reservas en:", filePath);

// 🔹 Endpoint que sincroniza y luego devuelve reservas
app.get("/reservas", async (req, res) => {
  try {
    console.log("🔄 Petición recibida en /reservas → sincronizando antes de responder...");

    await sincronizarBooking();

    if (!fs.existsSync(filePath)) {
      console.log("⚠️ reservas.json no existe todavía");
      return res.json({ campanilla: [], tejo: [] });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(data);

    console.log("📤 Enviando reservas:", {
      campanilla: json.campanilla?.length || 0,
      tejo: json.tejo?.length || 0
    });

    res.json(json);
  } catch (err) {
    console.error("❌ Error leyendo o sincronizando reservas:", err);
    res.json({ campanilla: [], tejo: [] });
  }
});

// 🔹 Arranque del servidor
function iniciarServidor() {
  try {
    app.listen(PORT, () => {
      console.log(`🌐 Servidor activo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error iniciando servidor:", err);
    process.exit(1);
  }
}

iniciarServidor();
