// server/server.js
import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs/promises";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Archivo donde guardaremos los días bloqueados
const BLOQUEADOS_FILE = path.join(process.cwd(), "server", "bloqueados.json");

// 🔹 Inicializar archivo si no existe
async function inicializarBloqueados() {
  try {
    await fs.access(BLOQUEADOS_FILE);
  } catch {
    await fs.writeFile(BLOQUEADOS_FILE, JSON.stringify({ campanilla: [], tejo: [], bloqueados: [] }, null, 2));
  }
}
inicializarBloqueados();

// 🔹 Servir archivos estáticos de la carpeta main (index.html, js, css)
app.use(express.static(path.join(process.cwd(), "main")));

// 🔹 GET reservas → devuelve JSON con reservas y bloqueados
app.get("/reservas", async (req, res) => {
  try {
    const data = await fs.readFile(BLOQUEADOS_FILE, "utf-8");
    const json = JSON.parse(data);
    res.json(json);
  } catch(err){
    console.error(err);
    res.status(500).json({ campanilla: [], tejo: [], bloqueados: [] });
  }
});

// 🔹 POST reservas → bloquea una fecha
app.post("/reservas", async (req, res) => {
  const { fecha } = req.body;
  if(!fecha) return res.status(400).json({ error: "Fecha no proporcionada" });

  try {
    const data = await fs.readFile(BLOQUEADOS_FILE, "utf-8");
    const json = JSON.parse(data);

    if(!json.bloqueados.includes(fecha)){
      json.bloqueados.push(fecha);
      await fs.writeFile(BLOQUEADOS_FILE, JSON.stringify(json, null, 2));
      res.json({ ok: true, fecha });
    } else {
      res.status(400).json({ error: "Fecha ya bloqueada" });
    }
  } catch(err){
    console.error(err);
    res.status(500).json({ error: "Error al guardar fecha" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
