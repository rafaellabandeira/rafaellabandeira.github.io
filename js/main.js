// main.js adaptado a d/m/Y completo

// ✅ Formateo DÍA/MES/AÑO
function formatearDMY(fecha) {
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const y = fecha.getFullYear();
  return `${d}/${m}/${y}`;
}

// --------------------- INICIALIZACIÓN ---------------------
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
    // Convertimos todas las fechas a d/m/Y directamente
    const data = await res.json();
    for (let cab in data) {
      data[cab] = data[cab].map(f => {
        const [y,m,d] = f.split("-"); // si vienen YYYY-MM-DD
        return `${d}/${m}/${y}`;
      });
    }
    return data;
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
    let actual = entrada;
    actual.setHours(0,0,0,0);
    const fin = salida;
    fin.setHours(0,0,0,0);
    let ocupado = false;

    while (actual < fin) {
      const fechaDMY = formatearDMY(actual);
      if (fechasOcupadas[cabana]?.includes(fechaDMY)) {
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
      const fechaDMY = formatearDMY(dayElem.dateObj);

      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else if (fechasOcupadas[cabana]?.includes(fechaDMY)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y", // ✅ Día/mes/año
    minDate: "today",
    locale: "es",
    disable: [
      function(date) {
        const cabana = document.getElementById("cabaña").value.toLowerCase();
        const fechaDMY = formatearDMY(date);
        return fechasOcupadas[cabana]?.includes(fechaDMY);
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
    document.querySelectorAll(".flatpickr-calendar").forEach(cal => cal._flatpickr.redraw());
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
    const [d,m,y] = entradaStr.split("/");
    const fechaEntrada = new Date(y, m-1, d);
    const [ds,ms,ys] = salidaStr.split("/");
    const fechaSalida = new Date(ys, ms-1, ds);
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
