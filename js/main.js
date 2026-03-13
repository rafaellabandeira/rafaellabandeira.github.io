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

      if (line.startsWith("DTSTART"))
        currentEvent.start = line.split(":")[1];

      if (line.startsWith("DTEND")) {

        currentEvent.end = line.split(":")[1];

        const start = new Date(
          currentEvent.start.slice(0,4) + "-" +
          currentEvent.start.slice(4,6) + "-" +
          currentEvent.start.slice(6,8)
        );

        const end = new Date(
          currentEvent.end.slice(0,4) + "-" +
          currentEvent.end.slice(4,6) + "-" +
          currentEvent.end.slice(6,8)
        );

        for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
          fechas.push(formatearLocal(new Date(d)));
        }

        currentEvent = {};
      }
    }

    return {
      campanilla: fechas,
      tejo: fechas
    };

  } catch (err) {

    console.error(err);

    return {
      campanilla: [],
      tejo: []
    };
  }
}

    // ===== CALENDARIO TIPO BOOKING (Rango) =====
function iniciarCalendarioBooking(fechasOcupadas) {

  const aviso = document.getElementById("avisoFechas");
  const inputRango = document.getElementById("fechas");
  const inputEntrada = document.getElementById("entrada");
  const inputSalida = document.getElementById("salida");

  function pintarDias(instance) {
    const cabana = document.getElementById("cabaña").value.toLowerCase();
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");

    days.forEach(dayElem => {
      const fechaISO = formatearLocal(dayElem.dateObj);
      dayElem.style.borderRadius = "6px";

      if (dayElem.dateObj < hoy || fechasOcupadas[cabana]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      } else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "";
      }
    });
  }

  flatpickr(inputRango, {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: { firstDayOfWeek: 1 },
    disable: [
      function(date) {
        const cabana = document.getElementById("cabaña").value.toLowerCase();
        return fechasOcupadas[cabana]?.includes(formatearLocal(date));
      }
    ],
    onChange: (selectedDates, dateStr, instance) => {
      pintarDias(instance);
      aviso.style.display = "none";

      if (selectedDates.length === 2) {
        inputEntrada.value = formatearLocal(selectedDates[0]);
        inputSalida.value = formatearLocal(selectedDates[1]);
      }
    },
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance)
  });
}
// ===== CALCULO RESERVA CORREGIDO =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!entradaStr || !salidaStr) {
    alert("Selecciona fechas");
    return;
  }

  if (!nombre || !telefono || !email) {
    alert("Completa todos los datos personales");
    return;
  }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    // Convertir fechas
    const [d, m, y] = entradaStr.split("/");
    const fechaEntrada = new Date(`${y}-${m}-${d}`);
    const [ds, ms, ys] = salidaStr.split("/");
    const fechaSalida = new Date(`${ys}-${ms}-${ds}`);

    const noches = (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24);
    let total = 0;
    let descuento = 0;
    let minNoches = esTemporadaAlta(fechaEntrada) ? 4 : 2;

    // Calcular total noche a noche
    for (let i = 0; i < noches; i++) {
      const dia = new Date(fechaEntrada);
      dia.setDate(dia.getDate() + i);
      const dow = dia.getDay();
      let precio;

      if (esTemporadaAlta(dia)) {
        precio = 150;
      } else {
        if (dow === 5 || dow === 6) precio = cabaña === "campanilla" ? 150 : 140;
        else precio = cabaña === "campanilla" ? 115 : 110;
      }

      total += precio;
    }

    // Aplicar descuento correctamente
    if (noches >= 6 && esTemporadaAlta(fechaEntrada)) {
      descuento = total * 0.10;
    } else if (noches >= 3 && !esTemporadaAlta(fechaEntrada)) {
      descuento = total * 0.10;
    }

    total -= descuento;

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    // Mostrar resultados
    const totalElem = document.getElementById("total");
totalElem.innerText = total.toFixed(2);
totalElem.classList.add("animar-precio");
setTimeout(()=> totalElem.classList.remove("animar-precio"),500);

document.getElementById("descuento").innerText = descuento.toFixed(2);

const pagoInicial = 50;

const restoElem = document.getElementById("resto");
restoElem.innerText = (total - pagoInicial).toFixed(2);
restoElem.classList.add("resaltar-resto");
setTimeout(()=> restoElem.classList.remove("resaltar-resto"),500);
    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}


// ===== CÁLCULO RESERVA =====
function esTemporadaAlta(fecha) {

  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  return (
    mes === 7 ||
    mes === 8 ||
    (mes === 12 && dia >= 22) ||
    (mes === 1 && dia <= 7)
  );

}



// ===== RESERVAR =====
function reservar() {
  alert("Aquí se conectará el pago de 50 €.");
}


// ===== CARRUSEL UNIVERSAL =====
function initCarousel(containerSelector, slideSelector, prevSelector, nextSelector, indicatorSelector) {

  const containers = document.querySelectorAll(containerSelector);

  containers.forEach(container => {

    const slides = container.querySelectorAll(slideSelector);

    const prevBtn = container.querySelector(prevSelector);
    const nextBtn = container.querySelector(nextSelector);

    const indicators = container.querySelectorAll(indicatorSelector);

    let currentIndex = 0;

    if (!slides.length) return;

    function showSlide(index) {

      slides.forEach((slide,i)=>{

        slide.style.display = i === index ? "block" : "none";

      });

      indicators.forEach((ind,i)=>{

        ind.classList.toggle("active", i===index);

      });

    }

    nextBtn?.addEventListener("click", ()=>{

      currentIndex = (currentIndex + 1) % slides.length;

      showSlide(currentIndex);

    });

    prevBtn?.addEventListener("click", ()=>{

      currentIndex = (currentIndex - 1 + slides.length) % slides.length;

      showSlide(currentIndex);

    });

    indicators.forEach((ind,i)=>{

      ind.addEventListener("click", ()=>{

        currentIndex = i;

        showSlide(currentIndex);

      });

    });

    showSlide(currentIndex);

  });

}


// ===== HAMBURGER =====
function initHamburger() {

  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  hamburger?.addEventListener("click", ()=>{

    navMenu?.classList.toggle("active");

    hamburger.classList.toggle("active");

  });

}

// ===== INICIALIZACIÓN GENERAL =====
document.addEventListener("DOMContentLoaded", async () => {

  // Inicializar menú hamburguesa
  initHamburger();

  // Inicializar carruseles
  initCarousel(".carousel-container", ".carousel-slide", ".prev", ".next", ".indicator");
  initCarousel(".carousel-container-general", ".carousel-slide-general", ".prev-general", ".next-general", ".indicator-general");

  // Cargar reservas desde Airbnb
  const reservas = await cargarReservasAirbnb();

  // Actualizar mensaje de urgencia
  actualizarUrgencia(reservas);

  // Inicializar calendario tipo Booking
  if (document.getElementById("cabaña") && document.getElementById("fechas")) {
    iniciarCalendarioBooking(reservas);
  }

  // Botón calcular precio
  const btnCalcular = document.getElementById("btnCalcular");
  if (btnCalcular) btnCalcular.addEventListener("click", calcularReserva);

  // Botón pagar
  const btnPagar = document.getElementById("btnPagar");
  if (btnPagar) btnPagar.addEventListener("click", reservar);

});
// ===== MENSAJE URGENCIA INTELIGENTE =====
function actualizarUrgencia(fechasOcupadas){

  const mensaje = document.getElementById("mensajeUrgencia");
  if(!mensaje) return;

  const hoy = new Date();
  const mesActual = hoy.getMonth()+1;

  const ocupadas = fechasOcupadas.campanilla.length;

  let texto = "";

  if(mesActual === 7 || mesActual === 8){

    texto = "🔥 Verano es temporada alta. Te recomendamos reservar pronto.";

  }
  else if(ocupadas > 20){

    texto = "⚡ Quedan pocas fechas disponibles este mes.";

  }
  else if(ocupadas > 10){

    texto = "📅 Este alojamiento suele reservarse rápido.";

  }
  else{

    texto = "✨ Reserva ahora para asegurar tus fechas.";

  }

  mensaje.innerText = texto;

}
