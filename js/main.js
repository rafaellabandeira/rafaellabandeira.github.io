import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js"; // ✅ idioma real

// ✅ FORMATEO LOCAL (SIN UTC — clave para que no bloquee días incorrectos)
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ✅ convierte d/m/Y → Date real
function parseDMY(fechaStr) {
  const [d, m, y] = fechaStr.split("/");
  return new Date(y, m - 1, d);
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

  function actualizarAviso(selectedDates, dateStr, instance) {
    const entradaStr = document.getElementById("entrada").value;
    const salidaStr = document.getElementById("salida").value;

    if (!entradaStr || !salidaStr) {
      aviso.style.display = "none";
      return;
    }

    const entrada = parseDMY(entradaStr);
    const salida = parseDMY(salidaStr);

    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    let ocupado = false;

    while (actual < salida) {
      const fechaLocal = formatearLocal(actual);

      if (fechasOcupadas[cabaña]?.includes(fechaLocal)) {
        ocupado = true;
        break;
      }

      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function pintarDia(dayElem, fechasOcupadas) {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const fechaLocal = formatearLocal(dayElem.dateObj);

    if (fechasOcupadas[cabaña]?.includes(fechaLocal)) {
      // 🔴 OCUPADO
      dayElem.style.background = "#f44336";
      dayElem.style.color = "#fff";
      dayElem.style.borderRadius = "6px";
    } else {
      // 🟢 LIBRE
      dayElem.style.background = "#e8f5e9";
      dayElem.style.color = "#000";
      dayElem.style.borderRadius = "6px";
    }
  }

  const config = {
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: Spanish,          // ✅ español real
    onChange: actualizarAviso,
    onDayCreate: (dObj, dStr, fp, dayElem) => pintarDia(dayElem, fechasOcupadas)
  };

  flatpickr("#entrada", config);
  flatpickr("#salida", config);
}

// --------------------- PRECIO ---------------------
function esTemporadaAlta(fechaStr) {
  const f = parseDMY(fechaStr);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;

  if(!entradaStr || !salidaStr){ alert("Selecciona fechas"); return; }

  const entrada = parseDMY(entradaStr);
  const salida = parseDMY(salidaStr);

  const noches = (salida - entrada) / (1000*60*60*24);

  let minNoches, precioNoche;

  if (esTemporadaAlta(entradaStr)) {
    minNoches = 4;
    precioNoche = cabaña === "campanilla" ? 150 : 140;
  } else {
    minNoches = 2;
    const diaSemana = entrada.getDay();
    precioNoche = (diaSemana === 5 || diaSemana === 6)
      ? (cabaña === "campanilla" ? 150 : 140)
      : (cabaña === "campanilla" ? 115 : 110);
  }

  if (noches < minNoches) {
    alert(`Mínimo ${minNoches} noches`);
    return;
  }

  let total = noches * precioNoche;
  let descuento = 0;

  if (!esTemporadaAlta(entradaStr) && noches >= 3) { descuento = total*0.10; total*=0.90; }
  if (esTemporadaAlta(entradaStr) && noches >= 6) { descuento = total*0.10; total*=0.90; }

  const resto = total - 50;

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("resto").innerText = resto.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
}

function reservar() {
  alert("Aquí se conectará el pago.");
}

// ---------------------
function initCarousel() {}
function initHamburger() {}
