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
      const fechaISO = formatearLocal(actual);
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
    const hoyISO = formatearLocal(new Date());

    // Día actual
    if (fechaISO === hoyISO) {
      dayElem.style.setProperty("border", "3px solid #FFD700", "important");
      dayElem.style.setProperty("border-radius", "50%", "important");
    }

    if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
      // 🔴 OCUPADO
      dayElem.style.setProperty("background", "#e53935", "important");
      dayElem.style.setProperty("color", "#fff", "important");
      dayElem.style.setProperty("border-radius", "6px", "important");
    } else {
      // 🟢 LIBRE
      dayElem.style.setProperty("background", "#e8f5e9", "important");
      dayElem.style.setProperty("color", "#000", "important");
      dayElem.style.setProperty("border-radius", "6px", "important");
    }
  };

  const fpConfig = {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",
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
  const cabaña = document.getElementById("cabaña").value.toLowerCase();
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  const aviso = document.getElementById("avisoFechas");

  if (!entrada || !salida) { alert("Selecciona fechas"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const [d, m, y] = entrada.split("/");
    const fechaEntrada = new Date(`${y}-${m}-${d}`);
    const [ds, ms, ys] = salida.split("/");
    const fechaSalida = new Date(`${ys}-${ms}-${ds}`);

    const noches = (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24);

    let minNoches, total = 0, descuento = 0;

    if (esTemporadaAlta(entrada)) {
      // 🔺 Temporada alta
      minNoches = 4;
      for (let i = 0; i < noches; i++) {
        const diaSemana = (fechaEntrada.getDay() + i) % 7; // 0-domingo ... 6-sábado
        total += (cabaña === "campanilla") ? 150 : 140;
      }
      if (noches >= 6) { descuento = total * 0.1; total *= 0.9; }
    } else {
      // 🔹 Temporada baja
      minNoches = 2;
      for (let i = 0; i < noches; i++) {
        const dia = new Date(fechaEntrada);
        dia.setDate(dia.getDate() + i);
        const diaSemana = dia.getDay(); // 0-domingo ... 6-sábado

        if (diaSemana === 5 || diaSemana === 6) { // viernes o sábado
          total += (cabaña === "campanilla") ? 150 : 140;
        } else {
          total += (cabaña === "campanilla") ? 115 : 110;
        }
      }
      if (noches >= 3) { descuento = total * 0.1; total *= 0.9; }
    }

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    const resto = total - 50;

    document.getElementById("cabañaSeleccionada").innerText = (cabaña === "campanilla") ? "Cabaña Campanilla" : "Cabaña El Tejo";
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("resto").innerText = resto.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);
    resultado.className = "resumen-reserva " + ((cabaña === "campanilla") ? "campanilla" : "tejo");

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 500);
}

function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- UI ---------------------
function initCarousel() {}
function initHamburger() {}
