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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
