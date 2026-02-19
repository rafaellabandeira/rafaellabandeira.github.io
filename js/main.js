import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";

document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservas = await cargarReservas();
  let fpEntrada, fpSalida;

  function crearCalendarios() {
    if (fpEntrada) fpEntrada.destroy();
    if (fpSalida) fpSalida.destroy();

    const config = getFlatpickrConfig(reservas);

    fpEntrada = flatpickr("#entrada", config);
    fpSalida  = flatpickr("#salida", config);
  }

  crearCalendarios();

  // Recrear calendarios al cambiar cabaña (importante para repintar colores)
  document.getElementById("cabaña").addEventListener("change", crearCalendarios);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGAR RESERVAS ---------------------
async function cargarReservas() {
  try {
    const res = await fetch("/reservas");
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    return await res.json();
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// --------------------- CONFIGURACIÓN FLATPICKR ---------------------
function getFlatpickrConfig(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  // Locale español con lunes como primer día (forzado)
  const localeEsp = {
    ...Spanish,
    firstDayOfWeek: 1,  // 1 = Lunes
  };

  function actualizarAviso() {
    const entradaVal = document.getElementById("entrada").value;
    const salidaVal  = document.getElementById("salida").value;
    if (!entradaVal || !salidaVal) {
      aviso.style.display = "none";
      return;
    }

    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entradaVal.split("/").reverse().join("-"));
    const fin    = new Date(salidaVal.split("/").reverse().join("-"));
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = actual.toISOString().split("T")[0];
      if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function aplicarEstilos(dayElem, esOcupado, esHoy) {
    // Reset + aplicar
    dayElem.classList.remove("ocupado");
    dayElem.style.backgroundColor = esOcupado ? "#f44336" : "#e6ffe6";
    dayElem.style.color           = esOcupado ? "#ffffff" : "#000000";

    if (esOcupado) dayElem.classList.add("ocupado");

    dayElem.style.border      = esHoy ? "3px solid #FFD700" : "";
    dayElem.style.borderRadius = esHoy ? "50%" : "";
    dayElem.style.boxSizing   = esHoy ? "border-box" : "";
  }

  function repintar(fp) {
    if (!fp?.days) return;
    fp.days.querySelectorAll(".flatpickr-day").forEach(day => {
      if (!day.dateObj) return;
      const fechaISO = day.dateObj.toISOString().split("T")[0];
      const hoyISO   = new Date().toISOString().split("T")[0];
      const cabaña   = document.getElementById("cabaña").value.toLowerCase();
      const esOcupado = fechasOcupadas[cabaña]?.includes(fechaISO) || false;
      const esHoy     = (fechaISO === hoyISO);

      aplicarEstilos(day, esOcupado, esHoy);
    });
  }

  return {
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: localeEsp,
    firstDayOfWeek: 1,  // redundante pero refuerza
    onChange: [actualizarAviso, () => repintar(fpEntrada), () => repintar(fpSalida)],
    onMonthChange: [repintar],
    onOpen: [repintar],
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      if (!dObj) return;
      const fechaISO = dObj.toISOString().split("T")[0];
      const hoyISO   = new Date().toISOString().split("T")[0];
      const cabaña   = document.getElementById("cabaña").value.toLowerCase();
      const esOcupado = fechasOcupadas[cabaña]?.includes(fechaISO) || false;
      const esHoy     = (fechaISO === hoyISO);

      aplicarEstilos(dayElem, esOcupado, esHoy);
    },
    disableMobile: "true"
  };
}

// --------------------- PRECIO Y RESERVA ---------------------
function esTemporadaAlta(fechaStr) {
  const parts = fechaStr.split("/");
  const f = new Date(parts[2], parts[1]-1, parts[0]);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function calcularReserva() {
  const cabaña   = document.getElementById("cabaña").value;
  const entrada  = document.getElementById("entrada").value;
  const salida   = document.getElementById("salida").value;
  const nombre   = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email    = document.getElementById("email").value.trim();

  if (!entrada || !salida) { alert("Selecciona fechas de entrada y salida"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  const spinner  = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const [dE, mE, aE] = entrada.split("/").map(Number);
    const [dS, mS, aS] = salida.split("/").map(Number);
    const fechaEnt = new Date(aE, mE-1, dE);
    const fechaSal = new Date(aS, mS-1, dS);
    const noches   = (fechaSal - fechaEnt) / (1000 * 60 * 60 * 24);

    if (noches <= 0) {
      alert("La fecha de salida debe ser posterior a la entrada");
      spinner.style.display = "none";
      return;
    }

    let minNoches, precioNoche;

    if (esTemporadaAlta(entrada)) {
      minNoches = 4;
      precioNoche = cabaña === "campanilla" ? 150 : 140;
    } else {
      minNoches = 2;
      const diaSem = fechaEnt.getDay();
      if (diaSem === 5 || diaSem === 6) {
        precioNoche = cabaña === "campanilla" ? 150 : 140;
      } else {
        precioNoche = cabaña === "campanilla" ? 115 : 110;
      }
    }

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    let total = noches * precioNoche;
    let descuento = 0;

    if (!esTemporadaAlta(entrada) && noches >= 3) { descuento = total * 0.10; total *= 0.90; }
    if (esTemporadaAlta(entrada) && noches >= 6) { descuento = total * 0.10; total *= 0.90; }

    const resto = total - 50;

    document.getElementById("cabañaSeleccionada").innerText =
      cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");

    document.getElementById("total").innerText     = total.toFixed(2);
    document.getElementById("resto").innerText     = resto.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 500);
}

function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- CARRUSEL / MENÚ ---------------------
function initCarousel() { /* tu código de carrusel aquí */ }
function initHamburger() { /* tu código de menú hamburguesa aquí */ }
