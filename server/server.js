// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { sincronizarAirbnb } from "./AirbnbSync.js"; // Nuevo: solo Airbnb

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// Ruta segura para reservas.json en Render
const filePath = path.join(process.env.TMPDIR || "/tmp", "reservas.json");
console.log("📂 Archivo reservas en:", filePath);

// 🔹 Endpoint que devuelve reservas
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
    console.error("❌ Error leyendo reservas:", err);
    res.json({ campanilla: [], tejo: [] });
  }
});

// 🔹 Arranque controlado
async function iniciarServidor() {
  try {
    console.log("🚀 Iniciando sincronización con Airbnb…");

    // Solo Airbnb
    await sincronizarAirbnb();

    console.log("✅ Sincronización terminada");

    // Comprobación final de archivo
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
