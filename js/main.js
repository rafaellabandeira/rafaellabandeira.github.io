// main.js

// ✅ Formateo en hora LOCAL (d/m/Y)
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// --------------------- INICIALIZACIÓN ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservas = await cargarReservasAirbnb();
  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGAR RESERVAS Airbnb ---------------------
async function cargarReservasAirbnb() {
  const ICAL_URL = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";
  const fechasOcupadas = { campanilla: [], tejo: [] };

  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) throw new Error("No se pudo cargar el iCal");
    const icalText = await res.text();

    // Parse sencillo de eventos (solo fechas de reserva completas)
    const regex = /DTSTART;VALUE=DATE:(\d{8})/g;
    let match;
    while ((match = regex.exec(icalText)) !== null) {
      const fecha = match[1];
      const f = `${fecha.slice(6)}/${fecha.slice(4,6)}/${fecha.slice(0,4)}`;
      // Para este ejemplo, ponemos todas en Campanilla
      fechasOcupadas.campanilla.push(f);
    }

  } catch(err) {
    console.error(err);
  }

  return fechasOcupadas;
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

      // Reset
      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      // Días del mes actual
      if (!dayElem.classList.contains("flatpickr-other-month")) {
        if (dayElem.dateObj < hoy) {           // Días pasados
          dayElem.style.background = "#212121";
          dayElem.style.color = "#fff";
          dayElem.style.pointerEvents = "none";
        }
        else if (fechasOcupadas[cabana]?.includes(fechaISO)) {  // Días reservados
          dayElem.style.background = "#e53935";
          dayElem.style.color = "#fff";
          dayElem.style.pointerEvents = "none";
        }
        else {                                 // Días disponibles
          dayElem.style.background = "#e8f5e9";
          dayElem.style.color = "#000";
        }
      } else { // Días fuera de mes
        dayElem.style.background = "#e8f5e9"; // verde
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "auto"; // se pueden seleccionar
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y",
    minDate: "today",
    showDaysInNextAndPreviousMonths: false, // ¡Solo el mes actual!
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
    }
  };

  const fpEntrada = flatpickr("#entrada", fpConfig);
  const fpSalida  = flatpickr("#salida", fpConfig);

  document.getElementById("cabaña").addEventListener("change", () => {
    fpEntrada.redraw();
    fpSalida.redraw();
  });
}

// --------------------- CALCULO RESERVA ---------------------
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!entradaStr || !salidaStr) { alert("Selecciona fechas"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const [d, m, y] = entradaStr.split("/");
    const fechaEntrada = new Date(`${y}-${m}-${d}`);
    const [ds, ms, ys] = salidaStr.split("/");
    const fechaSalida = new Date(`${ys}-${ms}-${ds}`);
    const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);

    let total = 0, descuento = 0;
    let minNoches = esTemporadaAlta(fechaEntrada) ? 4 : 2;

    for (let i=0; i<noches; i++) {
      const dia = new Date(fechaEntrada);
      dia.setDate(dia.getDate() + i);
      const dow = dia.getDay();
      let precio;

      if (esTemporadaAlta(dia)) {
        precio = cabaña === "campanilla" ? 150 : 150;
      } else {
        if (dow === 5 || dow === 6) precio = cabaña === "campanilla" ? 150 : 140;
        else precio = cabaña === "campanilla" ? 115 : 110;
      }

      total += precio;
    }

    if (esTemporadaAlta(fechaEntrada) && noches >= 6) descuento = total * 0.10;
    else if (!esTemporadaAlta(fechaEntrada) && noches >= 3) descuento = total * 0.10;

    total -= descuento;

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);
    document.getElementById("resto").innerText = (total - 50).toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}

// --------------------- RESERVAR ---------------------
function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- UI ---------------------
function initCarousel() {}
function initHamburger() {}
