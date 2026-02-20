// main.js
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js"; // ✅ idioma REAL en español

// ✅ Formateo en hora LOCAL (evita el bug del día anterior)
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservas = await cargarReservas();
  iniciarCalendarios(reservas);

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

// --------------------- CALENDARIO ---------------------
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = formatearLocal(actual); // ✅ ya NO usamos UTC
      if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  // 🎨 Pintar cada día
  const marcarDias = (dayElem) => {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const fechaISO = formatearLocal(dayElem.dateObj);

    if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
      // 🔴 OCUPADO
      dayElem.style.setProperty("background", "#e53935", "important");
      dayElem.style.setProperty("color", "#fff", "important");
      dayElem.style.setProperty("border-radius", "6px");
    } else {
      // 🟢 LIBRE
      dayElem.style.setProperty("background", "#e8f5e9", "important");
      dayElem.style.setProperty("color", "#000", "important");
      dayElem.style.setProperty("border-radius", "6px");
    }
  };

  const fpConfig = {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",

    // ✅ español REAL + lunes primer día
    locale: {
      ...Spanish,
      firstDayOfWeek: 1
    },

    onChange: actualizarAviso,
    onDayCreate: (dObj, dStr, fp, dayElem) => marcarDias(dayElem)
  };

  flatpickr("#entrada", fpConfig);
  flatpickr("#salida", fpConfig);
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
  if(!entrada || !salida){ alert("Selecciona fechas"); return; }

  const noches = (new Date(salida.split("/").reverse().join("-")) -
                  new Date(entrada.split("/").reverse().join("-"))) / 86400000;

  const precioNoche = cabaña === "campanilla" ? 115 : 110;
  const total = noches * precioNoche;

  document.getElementById("total").innerText = total.toFixed(2);
}

function reservar() {
  alert("Aquí se conectará el pago.");
}

// --------------------- UI ---------------------
function initCarousel() {}
function initHamburger() {}
