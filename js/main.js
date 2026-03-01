// main.js

// --------------------- UTILIDADES ---------------------
// Formateo en d/m/Y para calendario y comparación
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// Parse ical de Airbnb para obtener fechas ocupadas
async function cargarICal(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo cargar iCal Airbnb");
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const fechas = [];
    lines.forEach(line => {
      if (line.startsWith("DTSTART")) {
        const fecha = line.match(/DTSTART(?:;[^:]+)?:([0-9]{8})/);
        if (fecha) {
          const y = fecha[1].substring(0,4);
          const m = fecha[1].substring(4,6);
          const d = fecha[1].substring(6,8);
          fechas.push(`${d}/${m}/${y}`);
        }
      }
    });
    return fechas;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// --------------------- INICIALIZACIÓN ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservas = await cargarReservas();

  // Cargar Airbnb iCal y combinar con reservas locales
  const airbnb = await cargarICal("https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es");
  if (!reservas.campanilla) reservas.campanilla = [];
  if (!reservas.tejo) reservas.tejo = [];
  reservas.campanilla = [...new Set([...reservas.campanilla, ...airbnb])];
  reservas.tejo = [...new Set([...reservas.tejo, ...airbnb])];

  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGAR RESERVAS LOCALES ---------------------
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

      // Reset clases y estilos
      dayElem.classList.remove("ocupado", "disponible", "pasado");
      dayElem.style.pointerEvents = "";

      // Solo aplicar a días del mes visible
      if (!dayElem.classList.contains("prevMonthDay") && !dayElem.classList.contains("nextMonthDay")) {
        if (dayElem.dateObj < hoy) {           // Días pasados
          dayElem.classList.add("pasado");
          dayElem.style.pointerEvents = "none";
        } else if (fechasOcupadas[cabana]?.includes(fechaISO)) {  // Días ocupados
          dayElem.classList.add("ocupado");
          dayElem.style.pointerEvents = "none";
        } else {                                 // Días disponibles
          dayElem.classList.add("disponible");
        }
      }
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y",
    minDate: "today",
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
    disable: [
      function(date) {
        const cabana = document.getElementById("cabaña").value.toLowerCase();
        const fechaISO = formatearLocal(date);
        return fechasOcupadas[cabana]?.includes(fechaISO);
      }
    ],
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance),
    onChange: (selectedDates, dateStr, instance) => {
      actualizarAviso(selectedDates);
      pintarDias(instance);
    }
  };

  flatpickr("#entrada", fpConfig);
  flatpickr("#salida", fpConfig);

  document.getElementById("cabaña").addEventListener("change", () => {
    document.querySelectorAll(".flatpickr-calendar").forEach(cal => cal._flatpickr?.redraw());
  });
}

// --------------------- CÁLCULO DE RESERVA ---------------------
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
function initCarousel() { /* Tu lógica del carrusel */ }
function initHamburger() { /* Tu lógica del menú hamburguesa */ }
