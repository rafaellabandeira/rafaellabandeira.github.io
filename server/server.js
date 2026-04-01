// server/server.js
import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json()); // necesario para leer JSON en POST

// 🔹 Servir archivos estáticos de la carpeta main (donde está index.html y main.js)
app.use(express.static(path.join(process.cwd(), "main")));

// 🔹 Archivo donde guardamos los días bloqueados
const BLOQUEADOS_FILE = path.join(process.cwd(), "backend", "bloqueados.json");

// 🔹 Endpoint para obtener días bloqueados
app.get("/bloqueados", (req, res) => {
  try {
    const data = fs.readFileSync(BLOQUEADOS_FILE, "utf-8");
    const bloqueados = JSON.parse(data);
    res.json(bloqueados);
  } catch (err) {
    console.error("Error leyendo bloqueados.json:", err);
    res.status(500).json({ error: "No se pudo leer los días bloqueados" });
  }
});

// 🔹 Endpoint para actualizar días bloqueados (solo con contraseña)
app.post("/bloqueados", (req, res) => {
  const { password, fechas } = req.body;

  // 🔒 Comprobamos contraseña
  if (password !== "8111") {
    return res.status(401).json({ error: "Contraseña incorrecta" });
  }

  try {
    fs.writeFileSync(BLOQUEADOS_FILE, JSON.stringify(fechas, null, 2));
    res.json({ ok: true, bloqueados: fechas });
  } catch (err) {
    console.error("Error guardando bloqueados.json:", err);
    res.status(500).json({ error: "Error guardando días bloqueados" });
  }
});

// 🔹 Puerto
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
