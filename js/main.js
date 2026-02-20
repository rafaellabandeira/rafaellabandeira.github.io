// main.js
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js"; // idioma español

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

  const marcarDias = (dayElem) => {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const fechaISO = formatearLocal(dayElem.dateObj);

    if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
      dayElem.style.setProperty("background", "#e53935", "important"); // rojo
      dayElem.style.setProperty("color", "#fff", "important");
      dayElem.style.setProperty("border-radius", "6px");
    } else {
      dayElem.style.setProperty("background", "#e8f5e9", "important"); // verde
      dayElem.style.setProperty("color", "#000", "important");
      dayElem.style.setProperty("border-radius", "6px");
    }
  };

  const fpConfig = {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: { ...Spanish, firstDayOfWeek: 1 },
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
// --------------------- TOTAL ESTANCIA ---------------------
function calcularTotalEstancia(cabana, fechaEntrada, noches) {
  const PRECIOS = {
    campanilla: { alta: 150, baja: 115 },
    tejo: { alta: 140, baja: 110 }
  };
  const totalInicial = calcularTotalEstancia(cabaña, fechaEntrada, noches);
let total = totalInicial;
let descuento = 0;

// DESCUENTO
if (!esTemporadaAlta(fechaEntrada) && noches >= 3) {
  descuento = total * 0.10;
  total *= 0.90;
} else if (esTemporadaAlta(fechaEntrada) && noches >= 6) {
  descuento = total * 0.10;
  total *= 0.90;
}
  }
  return total;
}

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if(!entrada || !salida){ alert("Selecciona fechas"); return; }
  if(!nombre || !telefono || !email){ alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const [d, m, y] = entrada.split("/");
    const fechaEntrada = new Date(`${y}-${m}-${d}`);
    const [ds, ms, ys] = salida.split("/");
    const fechaSalida = new Date(`${ys}-${ms}-${ds}`);
    const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);

    let minNoches, total = 0, precioNoche, descuento = 0;

    if (esTemporadaAlta(entrada)) {
      minNoches = 4;
      for (let i=0; i<noches; i++) {
        const dia = new Date(fechaEntrada);
        dia.setDate(dia.getDate() + i);
        const dow = dia.getDay(); // 0-dom, 6-sáb
        if (cabaña === "campanilla") precioNoche = 150;
        else precioNoche = 140;
        total += precioNoche;
      }
      if (noches >= 6) { descuento = total*0.10; total *= 0.90; }
    } else { // temporada baja
      minNoches = 2;
      for (let i=0; i<noches; i++) {
        const dia = new Date(fechaEntrada);
        dia.setDate(dia.getDate() + i);
        const dow = dia.getDay(); // 0-dom, 6-sáb
        if (dow === 5 || dow === 6) { // viernes o sábado
          precioNoche = cabaña === "campanilla" ? 150 : 140;
        } else {
          precioNoche = cabaña === "campanilla" ? 115 : 110;
        }
        total += precioNoche;
      }
      if (noches >= 3) { descuento = total*0.10; total *= 0.90; }
    }

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

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
