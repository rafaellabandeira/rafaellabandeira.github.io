import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { sincronizarBooking } from "./BookingSync.js";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

/* 📍 Ruta ABSOLUTA segura en Render: usar carpeta temporal */
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");

console.log("📂 Archivo reservas en:", filePath);

/* 🔹 Endpoint que lee reservas */
app.get("/reservas", (req, res) => {
  try {
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
    console.error("Error leyendo reservas:", err);
    res.json({ campanilla: [], tejo: [] });
  }
});

/* 🔹 Arranque controlado (Render necesita esto) */
async function iniciarServidor() {
  try {
    console.log("🚀 Iniciando sincronización con Booking…");

    await sincronizarBooking();

    console.log("✅ Sincronización terminada");

    /* Verificamos que el JSON realmente exista */
    if (fs.existsSync(filePath)) {
      const contenido = JSON.parse(fs.readFileSync(filePath, "utf8"));
      console.log("📊 Reservas guardadas:", {
        campanilla: contenido.campanilla?.length || 0,
        tejo: contenido.tejo?.length || 0
      });
    } else {
      console.log("❌ reservas.json NO se creó");
    }

    app.listen(PORT, () => {
      console.log(`🌐 Servidor activo en puerto ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error iniciando servidor:", err);
    process.exit(1);
  }
}

iniciarServidor();
