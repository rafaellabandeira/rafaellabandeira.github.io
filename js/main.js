// main.js definitivo con iCal

// URL de tu iCal de Airbnb
const ICAL_URL = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";

// --------------------- UTILIDADES ---------------------
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2,"0");
  const d = String(fecha.getDate()).padStart(2,"0");
  return `${d}/${m}/${y}`;
}

// Convierte eventos iCal a array de fechas ocupadas dd/mm/yyyy
async function cargarFechasICal() {
  try {
    const res = await fetch(ICAL_URL);
    const icalText = await res.text();
    const fechas = [];

    // Parse simple de VEVENT con DTSTART y DTEND
    const lines = icalText.split("\n");
    let start = null, end = null;
    lines.forEach(line => {
      if (line.startsWith("DTSTART")) start = line.split(":")[1].slice(0,8);
      if (line.startsWith("DTEND")) {
        end = line.split(":")[1].slice(0,8);
        // Rango de fechas
        if (start && end) {
          let s = new Date(`${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6,8)}`);
          const e = new Date(`${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6,8)}`);
          while (s < e) {
            fechas.push(formatearLocal(s));
            s.setDate(s.getDate()+1);
          }
        }
        start = end = null;
      }
    });

    return fechas;
  } catch(e) {
    console.error("Error cargando iCal:", e);
    return [];
  }
}

// --------------------- CALENDARIO ---------------------
async function iniciarCalendarios() {
  const fechasOcupadas = await cargarFechasICal();
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  function pintarDias(instance) {
    const cabana = document.getElementById("cabaña").value.toLowerCase();
    const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");
    days.forEach(dayElem => {
      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      // Solo colorear días del mes actual
      if (dayElem.dateObj.getMonth() !== instance.currentMonth) {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "auto";
        dayElem.classList.remove("flatpickr-disabled");
        return;
      }

      const fechaISO = formatearLocal(dayElem.dateObj);

      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else if (fechasOcupadas.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "auto";
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y",
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
    minDate: "today",
    showMonths: 1,
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance),
    onChange: (selectedDates, dateStr, instance) => pintarDias(instance),
  };

  const fpEntrada = flatpickr("#entrada", fpConfig);
  const fpSalida  = flatpickr("#salida", fpConfig);

  document.getElementById("cabaña").addEventListener("change", () => {
    fpEntrada.redraw();
    fpSalida.redraw();
  });
}

// --------------------- INICIALIZACIÓN ---------------------
document.addEventListener("DOMContentLoaded", () => {
  iniciarCalendarios();
  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- RESERVA ---------------------
function calcularReserva() { /* tu función existente */ }
function reservar() { alert("Aquí se conectará el pago de 50 €"); }
