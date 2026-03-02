// ================= MAIN.JS COMPLETO MEJORADO =================

// ===== FORMATEO FECHA LOCAL (d/m/Y) =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// ===== CARGAR RESERVAS DESDE AIRBNB =====
const ICAL_URL = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";

async function cargarReservasAirbnb() {
  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) throw new Error("No se pudo cargar el iCal de Airbnb");
    const text = await res.text();

    const fechas = [];
    const lines = text.split("\n");
    let currentEvent = {};
    for (let line of lines) {
      if (line.startsWith("DTSTART")) currentEvent.start = line.split(":")[1];
      if (line.startsWith("DTEND")) {
        currentEvent.end = line.split(":")[1];
        const start = new Date(`${currentEvent.start.slice(0,4)}-${currentEvent.start.slice(4,6)}-${currentEvent.start.slice(6,8)}`);
        const end = new Date(`${currentEvent.end.slice(0,4)}-${currentEvent.end.slice(4,6)}-${currentEvent.end.slice(6,8)}`);
        for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
          fechas.push(formatearLocal(new Date(d)));
        }
        currentEvent = {};
      }
    }

    return { campanilla: fechas, tejo: fechas };
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// ===== IMPORTAR RESERVAS BACKEND =====
import { cargarReservas as cargarReservasBackend } from './ical-sync.js';

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservasAirbnb = await cargarReservasAirbnb();
  const reservasBackend = await cargarReservasBackend();

  // Combinar Airbnb + Backend
  const reservas = {
    campanilla: [...new Set([...reservasAirbnb.campanilla, ...reservasBackend.campanilla])],
    tejo: [...new Set([...reservasAirbnb.tejo, ...reservasBackend.tejo])]
  };

  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// ===== CALENDARIO MEJORADO CON FLATPICKR =====
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    const cabana = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = formatearLocal(actual);
      if (fechasOcupadas[cabana]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function pintarDias(instance) {
    const cabana = document.getElementById("cabaña").value.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");
    days.forEach(dayElem => {
      const fechaISO = formatearLocal(dayElem.dateObj);
      dayElem.style.borderRadius = "6px";

      // Días fuera del mes → verde si libres, rojo si ocupados
      if (dayElem.classList.contains("prevMonthDay") || dayElem.classList.contains("nextMonthDay")) {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "";
        if (fechasOcupadas[cabana]?.includes(fechaISO)) {
          dayElem.style.background = "#e53935";
          dayElem.style.color = "#fff";
          dayElem.style.pointerEvents = "none";
        }
        return;
      }

      // Días pasados
      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      // Días ocupados
      else if (fechasOcupadas[cabana]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      // Días disponibles
      else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "";
      }
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y",
    minDate: "today",
    showDaysInNextAndPreviousMonths: true,
    enable: [date => true],
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
        longhand: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
      },
      months: {
        shorthand: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
        longhand: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
      }
    },
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance),
    onChange: (selectedDates, dateStr, instance) => {
      actualizarAviso(selectedDates);
      pintarDias(instance);
    },
    disable: [
      function(date) {
        const cabana = document.getElementById("cabaña").value.toLowerCase();
        const fechaISO = formatearLocal(date);
        return fechasOcupadas[cabana]?.includes(fechaISO);
      }
    ]
  };

  // Inicializar flatpickr en ambos inputs
  flatpickr("#entrada", fpConfig);
  flatpickr("#salida", fpConfig);

  // Cambiar cabaña actual → repintar calendario
  document.getElementById("cabaña").addEventListener("change", () => {
    const fpEntrada = flatpickr("#entrada");
    const fpSalida = flatpickr("#salida");
    pintarDias(fpEntrada);
    pintarDias(fpSalida);
  });
}

// ===== CÁLCULO RESERVA =====
// (Aquí va tu código actual de calcularReserva() y reservar())
// No se cambia nada, se mantiene tal cual

// ===== UI =====
// initCarousel() y initHamburger() siguen igual
