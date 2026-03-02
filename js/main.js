// main.js definitivo: calendario por cabaña con Airbnb + backend

const AIRBNB_ICAL_URL = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";
const BACKEND_RESERVAS_URL = "/reservas"; // tu endpoint backend

function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// Cargar iCal Airbnb y separar por cabaña (si es necesario)
async function cargarFechasAirbnb() {
  try {
    const res = await fetch(AIRBNB_ICAL_URL);
    if (!res.ok) throw new Error("No se pudo cargar iCal Airbnb");
    const text = await res.text();
    const lines = text.split("\n");

    const fechas = { campanilla: [], tejo: [] };

    lines.forEach(line => {
      if (line.startsWith("DTSTART")) {
        const fechaStr = line.slice(8,16); // YYYYMMDD
        const y = fechaStr.slice(0,4);
        const m = fechaStr.slice(4,6);
        const d = fechaStr.slice(6,8);
        const fecha = `${d}/${m}/${y}`;
        // Aquí asumimos que Airbnb ocupa ambas cabañas, puedes ajustar
        fechas.campanilla.push(fecha);
        fechas.tejo.push(fecha);
      }
    });
    return fechas;
  } catch(err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// Cargar reservas del backend
async function cargarFechasBackend() {
  try {
    const res = await fetch(BACKEND_RESERVAS_URL);
    if (!res.ok) throw new Error("No se pudieron cargar reservas backend");
    const data = await res.json(); // { campanilla: [], tejo: [] }
    return {
      campanilla: data.campanilla || [],
      tejo: data.tejo || []
    };
  } catch(err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// Combinar fechas Airbnb + backend
function combinarFechas(airbnb, backend) {
  const resultado = { campanilla: [], tejo: [] };
  ["campanilla","tejo"].forEach(c => {
    resultado[c] = Array.from(new Set([...airbnb[c], ...backend[c]]));
  });
  return resultado;
}

async function initCalendarios() {
  const fechasAirbnb = await cargarFechasAirbnb();
  const fechasBackend = await cargarFechasBackend();
  const fechasOcupadas = combinarFechas(fechasAirbnb, fechasBackend);

  const aviso = document.getElementById("avisoFechas");
  const selectCabana = document.getElementById("cabaña");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) { aviso.style.display = "none"; return; }

    const cabana = selectCabana.value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = formatearLocal(actual);
      if (fechasOcupadas[cabana]?.includes(fechaISO)) { ocupado = true; break; }
      actual.setDate(actual.getDate() + 1);
    }
    aviso.style.display = ocupado ? "block" : "none";
  }

  function pintarDias(instance) {
    const cabana = selectCabana.value.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");
    days.forEach(dayElem => {
      const fechaISO = formatearLocal(dayElem.dateObj);

      // Reset
      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      if (dayElem.dateObj < hoy) {           // Pasado
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else if (fechasOcupadas[cabana]?.includes(fechaISO)) { // Ocupado
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else {                                 // Libre (incluye relleno final de mes)
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const fpConfig = {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance),
    onChange: (selectedDates, dateStr, instance) => {
      actualizarAviso(selectedDates);
      pintarDias(instance);
    }
  };

  const fpEntrada = flatpickr("#entrada", fpConfig);
  const fpSalida  = flatpickr("#salida", fpConfig);

  // Actualizar calendario al cambiar cabaña
  selectCabana.addEventListener("change", () => {
    fpEntrada.redraw();
    fpSalida.redraw();
  });
}

document.addEventListener("DOMContentLoaded", initCalendarios);
