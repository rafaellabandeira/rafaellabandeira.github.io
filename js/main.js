const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { syncBookingCalendar, getBlockedDates } = require("./bookingSync");

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------
   SINCRONIZACIÓN CON BOOKING
----------------------------- */

// sincroniza al arrancar el servidor
(async () => {
  console.log("🔄 Primera sincronización con Booking...");
  await syncBookingCalendar();
})();

// sincroniza automáticamente cada 30 minutos
cron.schedule("*/30 * * * *", async () => {
  console.log("🔄 Actualizando calendario Booking...");
  await syncBookingCalendar();
});


/* -----------------------------
   API PARA TU WEB
----------------------------- */

// endpoint que devuelve fechas bloqueadas
app.get("/api/bloqueadas", (req, res) => {
  const fechas = getBlockedDates();
  res.json(fechas);
});


/* -----------------------------
   TEST
----------------------------- */

app.get("/", (req, res) => {
  res.send("Servidor funcionando ✅");
});


/* -----------------------------
   PUERTO
----------------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
