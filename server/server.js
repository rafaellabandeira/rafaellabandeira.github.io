// server/server.js
import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Carpeta main con index.html, main.js y CSS
app.use(express.static(path.join(process.cwd(), "main")));

// 🔹 Archivo de reservas persistente
const reservasFile = path.join(process.cwd(), "server", "reservas.json");

// 🔹 Leer reservas desde archivo o crear si no existe
function leerReservas() {
  try {
    if(!fs.existsSync(reservasFile)){
      const init = { campanilla: [], tejo: [], bloqueados: [] };
      fs.writeFileSync(reservasFile, JSON.stringify(init,null,2));
      return init;
    }
    const data = fs.readFileSync(reservasFile,"utf-8");
    return JSON.parse(data);
  } catch(e){
    console.error("Error leyendo reservas:", e);
    return { campanilla: [], tejo: [], bloqueados: [] };
  }
}

// 🔹 Guardar reservas en archivo
function guardarReservas(reservas) {
  try {
    fs.writeFileSync(reservasFile, JSON.stringify(reservas,null,2));
  } catch(e){
    console.error("Error guardando reservas:", e);
  }
}

// 🔹 GET reservas
app.get("/reservas", (req,res)=>{
  const reservas = leerReservas();
  res.json(reservas);
});

// 🔹 POST bloquear día
app.post("/reservas", (req,res)=>{
  const { fecha } = req.body;
  if(!fecha) return res.status(400).json({ok:false, msg:"Falta fecha"});

  const reservas = leerReservas();
  if(!reservas.bloqueados.includes(fecha)){
    reservas.bloqueados.push(fecha);
    guardarReservas(reservas);
  }
  res.json({ok:true});
});

// 🔹 DELETE desbloquear día
app.delete("/reservas", (req,res)=>{
  const { fecha } = req.body;
  if(!fecha) return res.status(400).json({ok:false, msg:"Falta fecha"});

  const reservas = leerReservas();
  reservas.bloqueados = reservas.bloqueados.filter(f=>f!==fecha);
  guardarReservas(reservas);
  res.json({ok:true});
});

// 🔹 Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Servidor corriendo en puerto ${port}`));
