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


  // ===== CALENDARIO TIPO BOOKING (navegable con flechas) =====
let mesBase = new Date(); // mes inicial mostrado
let reservasGlobal = {};
let inicioSeleccion = null;
let finSeleccion = null;

function iniciarCalendarioBooking(fechasOcupadas, fechaBase = new Date()) {
  const container = document.getElementById("fechas");
  if (!container) return;
  container.innerHTML = "";

  const hoy = new Date();
  const cabana = document.getElementById("cabaña").value.toLowerCase();

  function actualizarSeleccion() {
    const dias = container.querySelectorAll(".fila-dia");
    dias.forEach(diaElem => {
      diaElem.classList.remove("seleccionado");
      const fecha = new Date(diaElem.dataset.fecha);
      if (inicioSeleccion && finSeleccion && fecha >= inicioSeleccion && fecha <= finSeleccion) {
        diaElem.classList.add("seleccionado");
      }
    });
  }

  function crearMes(ano, mes) {
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const mesContainer = document.createElement("div");
    mesContainer.classList.add("mes-calendario");
    mesContainer.style.marginRight = "10px";

    // Título del mes
    const tituloMes = document.createElement("div");
    tituloMes.classList.add("titulo-mes");
    tituloMes.innerText = primerDia.toLocaleString("es-ES", { month: "long", year: "numeric" });
    mesContainer.appendChild(tituloMes);

    // Fila de días de la semana
    const diasSemana = ["L","M","X","J","V","S","D"];
    diasSemana.forEach(dia => {
      const dElem = document.createElement("div");
      dElem.classList.add("dia-semana");
      dElem.innerText = dia;
      mesContainer.appendChild(dElem);
    });

    // Días del mes
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = new Date(ano, mes, d);
      const diaElem = document.createElement("div");
      diaElem.classList.add("fila-dia");
      diaElem.innerText = d;
      diaElem.dataset.fecha = fecha.toISOString().slice(0,10);

      // Día pasado
      if (fecha < hoy) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // Día reservado por Airbnb (formato d/m/Y)
      const fechaFormateada = formatearLocal(fecha);
      if (fechasOcupadas[cabana]?.includes(fechaFormateada)) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // Click selección
      diaElem.addEventListener("click", () => {
        if (diaElem.classList.contains("reservado")) return;

        if (!inicioSeleccion || (inicioSeleccion && finSeleccion)) {
          inicioSeleccion = fecha;
          finSeleccion = null;
        } else if (!finSeleccion) {
          if (fecha < inicioSeleccion) {
            finSeleccion = inicioSeleccion;
            inicioSeleccion = fecha;
          } else {
            finSeleccion = fecha;
          }
        }
        actualizarSeleccion();
      });

      mesContainer.appendChild(diaElem);
    }

    container.appendChild(mesContainer);
  }

  // Mostrar mes base + siguiente
  crearMes(fechaBase.getFullYear(), fechaBase.getMonth());
  const siguiente = new Date(fechaBase);
  siguiente.setMonth(siguiente.getMonth() + 1);
  crearMes(siguiente.getFullYear(), siguiente.getMonth());
}

// ===== FUNCIONES FLECHAS =====
function refrescarCalendario() {
  iniciarCalendarioBooking(reservasGlobal, mesBase);
}

// Botones navegación
document.getElementById("mesAnterior")?.addEventListener("click", () => {
  mesBase.setMonth(mesBase.getMonth() - 1);
  refrescarCalendario();
});
document.getElementById("mesSiguiente")?.addEventListener("click", () => {
  mesBase.setMonth(mesBase.getMonth() + 1);
  refrescarCalendario();
});
  
  
// ===== CALCULO RESERVA COMPLETO =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const diasSeleccionados = document.querySelectorAll(".fila-dia.seleccionado");

  if (!diasSeleccionados.length) {
    alert("Selecciona un rango de fechas");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  // Validación email
  if (!nombre || !telefono || !email) {
    if(!email || !/\S+@\S+\.\S+/.test(email)) {
      document.getElementById("email").classList.add("error");
      alert("Introduce un email válido");
    } else {
      document.getElementById("email").classList.remove("error");
      alert("Completa todos los datos personales");
    }
    return;
  } else {
    document.getElementById("email").classList.remove("error");
  }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");
  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const fechas = Array.from(diasSeleccionados).map(d => new Date(d.dataset.fecha));
    fechas.sort((a,b) => a - b);
    const fechaEntrada = fechas[0];
    const fechaSalida = new Date(fechas[fechas.length -1]);
    fechaSalida.setDate(fechaSalida.getDate() + 1); // salida al día siguiente

    const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);
    let total = 0;
    let descuento = 0;
    let minNoches = esTemporadaAlta(fechaEntrada) ? 4 : 2;

    for (let i = 0; i < noches; i++) {
      const dia = new Date(fechaEntrada);
      dia.setDate(dia.getDate() + i);
      const dow = dia.getDay();
      let precio;

      if (esTemporadaAlta(dia)) {
        precio = 150;
      } else {
        precio = (dow === 5 || dow === 6) ? (cabaña === "campanilla" ? 150 : 140) : (cabaña === "campanilla" ? 115 : 110);
      }

      total += precio;
    }

    // Descuento
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
    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";

    const totalElem = document.getElementById("total");
    totalElem.innerText = total.toFixed(2);
    totalElem.classList.add("animar-precio");
    setTimeout(()=> totalElem.classList.remove("animar-precio"),500);

    const descuentoElem = document.getElementById("descuento");
    descuentoElem.innerText = descuento.toFixed(2);

    const pagoInicial = 50;
    const restoElem = document.getElementById("resto");
    restoElem.innerText = (total - pagoInicial).toFixed(2);

    // Aplicar estilo destacado en verde con texto rojo
    restoElem.style.background = "#4caf50";
    restoElem.style.color = "#e53935";
    restoElem.style.padding = "2px 6px";
    restoElem.style.borderRadius = "4px";
    restoElem.style.fontWeight = "bold";
    restoElem.style.display = "inline-block";

    // Animación
    restoElem.classList.add("resaltar-resto");
    setTimeout(()=> restoElem.classList.remove("resaltar-resto"),500);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}

// ===== CALCULO TEMPORADA ALTA =====
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
