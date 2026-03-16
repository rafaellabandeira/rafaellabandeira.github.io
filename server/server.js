// server/server.js
import express from "express";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());

// 🔹 Servir archivos estáticos de la carpeta main (donde está tu index.html y main.js)
app.use(express.static(path.join(process.cwd(), "main")));

// 🔹 Endpoint de reservas (puedes reemplazarlo con tu backend real si lo deseas)
app.get("/reservas", (req, res) => {
  // Ejemplo: devolver un JSON con fechas bloqueadas
  // Si tu backend ya devuelve esto, simplemente haz fetch desde main.js
  res.json({
    campanilla: ["2026-03-18","2026-03-19"],
    tejo: ["2026-03-20","2026-03-21"]
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
