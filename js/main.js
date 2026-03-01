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

  const reservas = await cargarReservas();
  await cargarICal(reservas); // carga Airbnb iCal
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

// --------------------- CARGAR ICAL Airbnb ---------------------
async function cargarICal(reservas) {
  try {
    const urlICal = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";
    const res = await fetch(urlICal);
    if (!res.ok) throw new Error("No se pudo cargar el iCal de Airbnb");
    const icalText = await res.text();

    // Extraer fechas de bloqueo (entre DTSTART y DTEND)
    const lineas = icalText.split(/\r?\n/);
    let currentStart = null;
    let currentEnd = null;

    lineas.forEach(line => {
      if (line.startsWith("DTSTART")) {
        currentStart = line.split(":")[1].trim();
      } else if (line.startsWith("DTEND")) {
        currentEnd = line.split(":")[1].trim();
      } else if (line.startsWith("END:VEVENT")) {
        if (currentStart && currentEnd) {
          // Convertir a Date
          const start = new Date(currentStart.substr(0,4)+'-'+currentStart.substr(4,2)+'-'+currentStart.substr(6,2));
          const end   = new Date(currentEnd.substr(0,4)+'-'+currentEnd.substr(4,2)+'-'+currentEnd.substr(6,2));
          // Añadir todas las fechas entre start y end a las reservas de campanilla (puedes adaptarlo)
          let d = new Date(start);
          while (d < end) {
            reservas.campanilla.push(formatearLocal(d));
            d.setDate(d.getDate() + 1);
          }
        }
        currentStart = null;
        currentEnd = null;
      }
    });

  } catch(err) {
    console.error("Error cargando iCal:", err);
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

      // Reset estilos
      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      if (dayElem.dateObj < hoy) {           // Días pasados
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else if (fechasOcupadas[cabana]?.includes(fechaISO)) {  // Días ocupados
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else {                                 // Días disponibles
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y", // ✅ día/mes/año
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
