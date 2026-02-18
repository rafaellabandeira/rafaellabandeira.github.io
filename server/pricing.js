// server/pricing.js
// Calcula el precio de reserva según cabaña, fechas y reglas de temporada

import fs from "fs";
import path from "path";

// Archivo de reservas locales
const reservasFile = path.join(process.cwd(), "js", "reservas.json");

/**
 * Verifica si una fecha está en temporada alta
 * @param {Date} fecha 
 * @returns {boolean}
 */
export function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return mes === 7 || mes === 8 || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

/**
 * Verifica si un rango de fechas incluye fin de semana (viernes o sábado)
 * @param {Date} fechaInicio 
 * @param {number} noches 
 * @returns {boolean}
 */
export function incluyeFinDeSemana(fechaInicio, noches) {
  for (let i = 0; i < noches; i++) {
    const d = new Date(fechaInicio);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 5 || d.getDay() === 6) return true;
  }
  return false;
}

/**
 * Calcula el precio total de la reserva
 * @param {string} cabana - "campanilla" o "tejo"
 * @param {string} fechaInicioStr - yyyy-mm-dd
 * @param {string} fechaFinStr - yyyy-mm-dd
 * @returns {object} { total, descuento, noches }
 */
export function calcularPrecio(cabana, fechaInicioStr, fechaFinStr) {
  const fechaInicio = new Date(fechaInicioStr);
  const fechaFin = new Date(fechaFinStr);

  const noches = (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24);

  if (noches <= 0) throw new Error("Fechas inválidas");

  let precioNoche = 0;
  if (cabana === "campanilla") {
    precioNoche = esTemporadaAlta(fechaInicio) ? 150 : 115;
    if (esTemporadaAlta(fechaInicio) && noches < 4) {
      throw new Error("En temporada alta mínimo 4 noches");
    }
    if (!esTemporadaAlta(fechaInicio) && noches < 2) {
      throw new Error("Mínimo 2 noches fuera de temporada alta: 2 noches");
    }
  } else if (cabana === "tejo") {
    precioNoche = esTemporadaAlta(fechaInicio) ? 140 : 110;
    if (esTemporadaAlta(fechaInicio) && noches < 4) {
      throw new Error("En temporada alta mínimo 4 noches");
    }
    if (!esTemporadaAlta(fechaInicio) && noches < 2) {
      throw new Error("Mínimo 2 noches fuera de temporada alta: 2 noches");
    }
  } else {
    throw new Error("Cabaña no válida");
  }

  let total = noches * precioNoche;
  let descuento = 0;

  // Descuentos
  if (!esTemporadaAlta(fechaInicio) && noches >= 3 && !incluyeFinDeSemana(fechaInicio, noches)) {
    descuento = total * 0.10;
    total *= 0.90;
  }
  if (esTemporadaAlta(fechaInicio) && noches >= 6) {
    descuento = total * 0.10;
    total *= 0.90;
  }

  return { total, descuento, noches };
}

/**
 * Verifica si las fechas están disponibles según reservas.json
 * @param {string} cabana 
 * @param {string} fechaInicioStr 
 * @param {string} fechaFinStr 
 * @returns {boolean} true si disponible
 */
export function fechasDisponibles(cabana, fechaInicioStr, fechaFinStr) {
  const reservas = JSON.parse(fs.readFileSync(reservasFile, "utf-8"));
  const ocupadas = reservas[cabana] || [];

  const fechaInicio = new Date(fechaInicioStr);
  const fechaFin = new Date(fechaFinStr);

  let current = new Date(fechaInicio);

  while (current < fechaFin) {
    const f = current.toISOString().slice(0, 10);
    if (ocupadas.includes(f)) return false;
    current.setDate(current.getDate() + 1);
  }

  return true;
}

