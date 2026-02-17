const express = require("express");
const path = require("path");
const fs = require("fs");

const syncBookingCalendar = require("./bookingSync");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   CARPETA PÚBLICA (tu web)
================================ */
app.use(express.static(path.join(__dirname, "..")));

/* ===============================
   ENDPOINT PARA LEER reservas.json
   (el calendario del frontend lo usa)
================================ */
app.get("/api/reservas", (req, res) => {
  const filePath = path.join(__dirname, "../js/reservas.json");

  if (!fs.existsSync(filePath)) {
    return res.json([]);
  }

  const data = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "application/json");
  res.send(data);
});

/* ===============================
   SINCRONIZAR BOOKING AL ARRANCAR
================================ */
syncBookingCalendar();

/* ===============================
   SINCRONIZACIÓN AUTOMÁTICA
   Cada 30 minutos Booking → Web
================================ */
setInterval(() => {
  syncBookingCalendar();
}, 30 * 60 * 1000);

/* ===============================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
});
