// main.js

import flatpickr from "flatpickr";

let fechasOcupadas = { campanilla: [], tejo: [] };
let fpEntrada, fpSalida;

// -------------------- CARGA DE DISPONIBILIDAD --------------------
export async function cargarDisponibilidad() {
  try {
    const res = await fetch("https://rafaellabandeira-github-io.onrender.com/reservas");
    const data = await res.json();
    fechasOcupadas.campanilla = data.campanilla || [];
    fechasOcupadas.tejo = data.tejo || [];
    console.log("Disponibilidad cargada:", fechasOcupadas);
  } catch (e) {
    console.error("Error cargando disponibilidad", e);
  }
}

// -------------------- FECHAS --------------------
function crearFechaLocal(fechaStr) {
  const partes = fechaStr.split("-");
  return new Date(partes[0], partes[1]-1, partes[2]);
}

function esTemporadaAlta(fecha) {
  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const diaSemana = fecha.getDay();
  const esViernesSabado = diaSemana === 5 || diaSemana === 6;

  const esVerano = mes === 7 || mes === 8;
  const esNavidad = (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);

  // Temporada alta: verano, navidad/año nuevo, viernes/sábado
  return esVerano || esNavidad || esViernesSabado;
}

function rangoOcupado(cabana, entrada, salida) {
  const inicio = crearFechaLocal(entrada);
  const fin = crearFechaLocal(salida);
  for (let d = new Date(inicio); d < fin; d.setDate(d.getDate()+1)) {
    const fechaISO = d.toISOString().slice(0,10);
    if (fechasOcupadas[cabana]?.includes(fechaISO)) return true;
  }
  return false;
}

function calcularTotalEstancia(cabana, fechaEntrada, noches) {
  const PRECIOS = {
    campanilla: { alta: 150, baja: 110 },
    tejo: { alta: 140, baja: 110 }
  };
  let total = 0;
  for (let i = 0; i < noches; i++) {
    const d = new Date(fechaEntrada.getFullYear(), fechaEntrada.getMonth(), fechaEntrada.getDate()+i);
    const alta = esTemporadaAlta(d);
    total += PRECIOS[cabana][alta ? "alta" : "baja"];
  }
  return { total };
}

// -------------------- RESERVA --------------------
export async function calcularReserva() {
  const cabana = document.getElementById("cabaña").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!entradaStr || !salidaStr) { alert("Selecciona fechas"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  await cargarDisponibilidad();

  if (rangoOcupado(cabana, entradaStr, salidaStr)) {
    alert("❌ Estas fechas ya están reservadas en Booking.");
    return;
  }

  const entrada = crearFechaLocal(entradaStr);
  const salida = crearFechaLocal(salidaStr);
  const noches = Math.round((salida - entrada)/(1000*60*60*24));

  // -------------------- ESTANCIA MÍNIMA --------------------
  let minEstancia = 2; // temporada baja por defecto
  let hayAlta = [...Array(noches).keys()].some(i =>
    esTemporadaAlta(new Date(entrada.getFullYear(), entrada.getMonth(), entrada.getDate()+i))
  );

  if (hayAlta) minEstancia = 4; // temporada alta, fines de semana y navidad
  if (noches < minEstancia) { 
    alert(`Estancia mínima: ${minEstancia} noches`); 
    return; 
  }

  let { total } = calcularTotalEstancia(cabana, entrada, noches);

  // -------------------- DESCUENTOS --------------------
  let descuento = 0;
  if (!hayAlta && noches >= 3) { descuento = total*0.1; total *= 0.9; }
  if (hayAlta && noches > 6) { descuento = total*0.1; total *= 0.9; }

  // -------------------- ACTUALIZAR HTML --------------------
  const resumen = document.getElementById("resultado");
  resumen.className = "resumen-reserva " + (cabana==="campanilla"?"campanilla":"tejo");
  document.getElementById("cabañaSeleccionada").innerText = cabana==="campanilla"?"Cabaña Campanilla":"Cabaña El Tejo";
  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total-50).toFixed(2);
  document.getElementById("spinner").style.display="none";
  resumen.style.display="block";
}

export function reservar() {
  alert("Reserva confirmada. Señal de 50 € pagada.");
}

// -------------------- FLATPICKR --------------------
export function inicializarCalendarios(cabana) {
  const diasOcupados = fechasOcupadas[cabana] || [];
  if (fpEntrada) fpEntrada.destroy();
  if (fpSalida) fpSalida.destroy();

  const opciones = {
    dateFormat:"Y-m-d",
    minDate:"today",
    disable:diasOcupados,
    firstDayOfWeek:1, // lunes
    onDayCreate: (dObj,dStr,fp,dayElem) => {
      const fecha = dayElem.dateObj.toISOString().split("T")[0];
      if (diasOcupados.includes(fecha)) dayElem.classList.add("ocupado");
    }
  };

  fpEntrada = flatpickr("#entrada", opciones);
  fpSalida = flatpickr("#salida", opciones);
}

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener("DOMContentLoaded", async () => {
  await cargarDisponibilidad();
  const selectCabana = document.getElementById("cabaña");
  inicializarCalendarios(selectCabana.value);
  selectCabana.addEventListener("change", ()=>inicializarCalendarios(selectCabana.value));

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});
