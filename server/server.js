import { getBookingBlockedDates } from "./bookingSync.js";

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, Environment } = require('square');
const { calcularPrecio } = require('./pricing');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Square
const squareClient = new Client({
  environment: Environment.Production,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

const locationId = process.env.SQUARE_LOCATION_ID;

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('Backend de reservas activo');
});

// Endpoint para calcular precio
app.post('/calculate-price', (req, res) => {
  const { fechaInicio, fechaFin } = req.body;
  const precio = calcularPrecio(fechaInicio, fechaFin);
  res.json({ precio });
});

// Endpoint de pago con Square
app.post('/create-payment', async (req, res) => {
  const { nonce, amount, nombre, telefono } = req.body;
  try {
    const paymentsApi = squareClient.paymentsApi;
    const response = await paymentsApi.createPayment({
      sourceId: nonce,
      idempotencyKey: Date.now().toString(),
      amountMoney: {
        amount: amount * 100, // en céntimos
        currency: "EUR"
      },
      locationId,
      note: `Reserva de ${nombre}, teléfono: ${telefono}`
    });
    res.json(response.result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
app.get("/availability/campanilla", async (req, res) => {
  try {
    const blocked = await getBookingBlockedDates();
    res.json(blocked);
  } catch (err) {
    console.error("Error leyendo Booking:", err);
    res.status(500).send("Error sincronizando con Booking");
  }
});



