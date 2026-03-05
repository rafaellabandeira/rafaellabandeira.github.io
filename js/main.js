// ================= MAIN.JS COMPLETO =================

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
        const start = new Date(currentEvent.start.slice(0,4)+'-'+currentEvent.start.slice(4,6)+'-'+currentEvent.start.slice(6,8));
        const end = new Date(currentEvent.end.slice(0,4)+'-'+currentEvent.end.slice(4,6)+'-'+currentEvent.end.slice(6,8));
        for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) fechas.push(formatearLocal(new Date(d)));
        currentEvent = {};
      }
    }
    return { campanilla: fechas, tejo: fechas };
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
  initCarouselCabanas();
  initCarouselIndex();
  initHamburger();

  const reservas = await cargarReservasAirbnb();

  if (document.getElementById("cabaña") &&
      document.getElementById("entrada") &&
      document.getElementById("salida") &&
      document.getElementById("avisoFechas")) {
    iniciarCalendarios(reservas);
  }

  const btnCalcular = document.getElementById("btnCalcular");
  if (btnCalcular) btnCalcular.addEventListener("click", calcularReserva);

  const btnPagar = document.getElementById("btnPagar");
  if (btnPagar) btnPagar.addEventListener("click", reservar);
});

// ===== CALENDARIO CON FLATPICKR =====
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) { aviso.style.display = "none"; return; }

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
      if (dayElem.classList.contains("prevMonthDay") || dayElem.classList.contains("nextMonthDay")) {
        dayElem.style.background = "";
        dayElem.style.color = "";
        dayElem.style.pointerEvents = "";
        return;
      }

      const fechaISO = formatearLocal(dayElem.dateObj);
      dayElem.style.borderRadius = "6px";

      if (dayElem.dateObj < hoy) {           
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      else if (fechasOcupadas[cabana]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
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
    fpConfig.onMonthChange([], "", flatpickr("#entrada"));
    fpConfig.onMonthChange([], "", flatpickr("#salida"));
  });
}

// ===== CÁLCULO RESERVA =====
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

// ===== RESERVAR =====
function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// ===== UI =====

// ---------- CARRUSEL CABAÑAS ----------
function initCarouselCabanas() {
  const carousels = document.querySelectorAll('.cabana-galeria .carousel-container');
  carousels.forEach(container => {
    const slides = container.querySelectorAll('.carousel-slide');
    const nextBtn = container.querySelector('.next');
    const prevBtn = container.querySelector('.prev');
    let currentIndex = 0;

    if (!slides.length) return;

    function showSlide(index) {
      slides.forEach(slide => slide.classList.remove('active'));
      slides[index].classList.add('active');
    }

    if (nextBtn) nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
    });

    showSlide(currentIndex);
  });
}

// ---------- CARRUSEL INDEX PRINCIPAL ----------

function initCarouselIndex() {
  const carousels = document.querySelectorAll('section .carousel-container');

  carousels.forEach(container => {
    const slides = container.querySelectorAll('.carousel-slide');
    const nextBtn = container.querySelector('.next');
    const prevBtn = container.querySelector('.prev');
    const indicators = container.querySelectorAll('.indicator');
    let currentIndex = 0;

    if (!slides.length) return;

    function showSlide(index) {
      slides.forEach(slide => slide.classList.remove('active'));
      slides[index].classList.add('active');

      indicators.forEach(ind => ind.classList.remove('active'));
      if (indicators[index]) indicators[index].classList.add('active');
    }

    nextBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    });

    prevBtn?.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
    });

    indicators.forEach((ind, i) => {
      ind.addEventListener('click', () => {
        currentIndex = i;
        showSlide(currentIndex);
      });
    });

    showSlide(currentIndex);
  });
}
// ---------- HAMBURGER ----------
function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  hamburger?.addEventListener("click", () => {
    navMenu?.classList.toggle("active");
    hamburger.classList.toggle("active");
  });
}
