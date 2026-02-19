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

    fpEntrada = flatpickr("#entrada", getFlatpickrConfig(reservas));
    fpSalida  = flatpickr("#salida",  getFlatpickrConfig(reservas));
  }

  crearCalendarios();

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

  function actualizarAviso() {
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {  // ← día de salida NO cuenta como ocupado
      const fechaISO = actual.toISOString().split("T")[0];
      if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function marcarDias(dObj, dStr, fp, dayElem) {
    const fechaISO = dObj.toISOString().split("T")[0];
    const hoyISO = new Date().toISOString().split("T")[0];
    const cabaña = document.getElementById("cabaña").value.toLowerCase();

    // Resetear estilos primero para evitar sobrescrituras
    dayElem.style.backgroundColor = "";
    dayElem.style.color = "";
    dayElem.style.border = "";
    dayElem.style.borderRadius = "";
    dayElem.classList.remove("ocupado");

    // Aplicar fondo según estado (prioridad: ocupado > libre)
    if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
      dayElem.style.backgroundColor = "#f44336";
      dayElem.style.color = "#ffffff";
      dayElem.classList.add("ocupado");
    } else {
      // Días libres SIEMPRE verde suave si no están ocupados
      dayElem.style.backgroundColor = "#e6ffe6";
      dayElem.style.color = "#000000";
    }

    // Día actual: borde amarillo (se aplica al final → tiene prioridad visual)
    if (fechaISO === hoyISO) {
      dayElem.style.border = "3px solid #FFD700";
      dayElem.style.borderRadius = "50%";
      dayElem.style.boxSizing = "border-box";
    }
  }

  return {
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: Spanish,
    firstDayOfWeek: 1,
    onChange: actualizarAviso,
    onDayCreate: marcarDias,
    disableMobile: true  // mejora UX en móviles
  };
}

// --------------------- PRECIO Y RESERVA ---------------------
function esTemporadaAlta(fecha) {
  const f = new Date(fecha);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!entrada || !salida) { alert("Selecciona fechas de entrada y salida"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const noches = (new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24);
    if (noches <= 0) {
      alert("La fecha de salida debe ser posterior a la de entrada");
      spinner.style.display = "none";
      return;
    }

    const fechaEntrada = new Date(entrada);
    let minNoches, precioNoche;

    if (esTemporadaAlta(entrada)) {
      minNoches = 4;
      precioNoche = cabaña === "campanilla" ? 150 : 140;
    } else {
      minNoches = 2;
      const diaSemana = fechaEntrada.getDay();
      if (diaSemana === 5 || diaSemana === 6) {
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

    if (!esTemporadaAlta(entrada) && noches >= 3) {
      descuento = total * 0.10;
      total *= 0.90;
    }
    if (esTemporadaAlta(entrada) && noches >= 6) {
      descuento = total * 0.10;
      total *= 0.90;
    }

    const resto = total - 50;

    document.getElementById("cabañaSeleccionada").innerText =
      cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");

    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("resto").innerText = resto.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 500);
}

function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- CARRUSEL / MENÚ ---------------------
function initCarousel() { /* tu código de carrusel */ }
function initHamburger() { /* tu código de menú hamburguesa */ }
