// ================= MAIN.JS COMPLETO =================

// ===== FORMATEO FECHA LOCAL (d/m/Y) =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ===== CARGAR RESERVAS DESDE BACKEND =====
const BACKEND_URL = "https://rafaellabandeira-github-io.onrender.com/reservas";

async function cargarReservasBackend() {
  try {
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("No se pudo cargar las reservas desde el backend");
    const data = await res.json();

    const reservas = { campanilla: [], tejo: [] };
    for (let cabana of ["campanilla", "tejo"]) {
      reservas[cabana] = data[cabana]?.map(f => f.slice(0,10)) || [];
    }
    return reservas;
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// ===== VARIABLES GLOBALES =====
let mesBase = new Date();
let reservasGlobal = {};
let inicioSeleccion = null;
let finSeleccion = null;

// ===== CALCULO RESERVA =====
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
    fechaSalida.setDate(fechaSalida.getDate() + 1);

    const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);

    const opciones = { day: "numeric", month: "short" };
    const entradaTexto = fechaEntrada.toLocaleDateString("es-ES", opciones);
    const salidaTexto = fechaSalida.toLocaleDateString("es-ES", opciones);

    document.getElementById("fechasSeleccionadas").innerHTML =
      `📅 ${entradaTexto} - ${salidaTexto}<br>🛏 ${noches} ${noches === 1 ? "noche" : "noches"}`;

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

    if (noches >= 6 && esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;
    else if (noches >= 3 && !esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;

    total -= descuento;

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    document.getElementById("cabañaSeleccionada").innerText =
      cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";

    const totalElem = document.getElementById("total");
    totalElem.innerText = total.toFixed(2);
    totalElem.classList.add("animar-precio");
    setTimeout(()=> totalElem.classList.remove("animar-precio"),500);

    const descuentoElem = document.getElementById("descuento");
    descuentoElem.innerText = descuento.toFixed(2);

    const pagoInicial = 50;
    const restoElem = document.getElementById("resto");
    restoElem.innerText = (total - pagoInicial).toFixed(2);
    restoElem.style.color = "#e53935";
    restoElem.style.fontWeight = "bold";
    restoElem.classList.add("resaltar-resto");
    setTimeout(()=> restoElem.classList.remove("resaltar-resto"),500);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 7 || mes === 8 || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7));
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

// ===== CALENDARIO BOOKING (1 MES) =====
function iniciarCalendarioBooking(fechasOcupadas, fechaBase = new Date()) {
  const container = document.getElementById("fechas");
  if (!container) return;
  container.innerHTML = "";

  reservasGlobal = fechasOcupadas;

  const primerDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), 1);
  const ultimoDia = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + 1, 0);

  const mesContainer = document.createElement("div");
  mesContainer.classList.add("mes-calendario");

  // Barra superior con título y flechas
  const barraSuperior = document.createElement("div");
  barraSuperior.classList.add("barra-superior");
  barraSuperior.style.display = "flex";
  barraSuperior.style.justifyContent = "space-between";
  barraSuperior.style.alignItems = "center";
  barraSuperior.style.marginBottom = "5px";

  const prev = document.createElement("button");
  prev.className = "flecha-mes";
  prev.innerHTML = "◀";
  prev.addEventListener("click", ()=>{
    mesBase = new Date(mesBase.getFullYear(), mesBase.getMonth() - 1, 1);
    iniciarCalendarioBooking(reservasGlobal, mesBase);
  });

  const next = document.createElement("button");
  next.className = "flecha-mes";
  next.innerHTML = "▶";
  next.addEventListener("click", ()=>{
    mesBase = new Date(mesBase.getFullYear(), mesBase.getMonth() + 1, 1);
    iniciarCalendarioBooking(reservasGlobal, mesBase);
  });

  const tituloMes = document.createElement("div");
  tituloMes.classList.add("titulo-mes");
  tituloMes.innerText = primerDia.toLocaleString("es-ES", { month: "long", year: "numeric" });
  tituloMes.style.textAlign = "center";
  tituloMes.style.flexGrow = "1";

  barraSuperior.append(prev, tituloMes, next);
  mesContainer.appendChild(barraSuperior);

  // Días de la semana
  const diasSemana = ["L","M","X","J","V","S","D"];
  diasSemana.forEach(dia => {
    const dElem = document.createElement("div");
    dElem.classList.add("dia-semana");
    dElem.innerText = dia;
    mesContainer.appendChild(dElem);
  });

  // Días vacíos
  let primerDiaSemana = primerDia.getDay();
  primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
  for (let i = 0; i < primerDiaSemana; i++) {
    const empty = document.createElement("div");
    empty.classList.add("fila-dia", "empty-dia");
    mesContainer.appendChild(empty);
  }

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), d);
    const diaElem = document.createElement("div");
    diaElem.classList.add("fila-dia");
    diaElem.innerText = d;
    diaElem.dataset.fecha = formatearLocal(fecha);

    const cabañaElem = document.getElementById("cabaña");
    const cabana = cabañaElem ? cabañaElem.value.toLowerCase() : null;

    // Bloquear días pasados o reservados
    if (fecha < hoy || (cabana && reservasGlobal[cabana]?.includes(formatearLocal(fecha)))) {
      diaElem.classList.add("reservado");
      diaElem.style.cursor = "not-allowed";
    }

    // Selección de rango
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

      const todosDias = document.querySelectorAll(".fila-dia");
      todosDias.forEach(d => d.classList.remove("seleccionado"));
      todosDias.forEach(d => {
        const f = new Date(d.dataset.fecha);
        if (inicioSeleccion && finSeleccion && f >= inicioSeleccion && f <= finSeleccion) {
          d.classList.add("seleccionado");
        }
      });
    });

    mesContainer.appendChild(diaElem);
  }

  container.appendChild(mesContainer);
}

// ===== FUNCION ACTUALIZAR RESERVAS =====
async function actualizarReservas() {
  const reservas = await cargarReservasBackend();
  reservasGlobal = reservas;
  actualizarUrgencia(reservas);
  if (document.getElementById("cabaña") && document.getElementById("fechas")) {
    iniciarCalendarioBooking(reservasGlobal, mesBase);
  }
}

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

// ===== INICIALIZACIÓN GENERAL =====
document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initCarousel(".carousel-container", ".carousel-slide", ".prev", ".next", ".indicator");
  initCarousel(".carousel-container-general", ".carousel-slide-general", ".prev-general", ".next-general", ".indicator-general");

  await actualizarReservas();

  // Actualizar cada 2 horas
  setInterval(actualizarReservas, 2 * 60 * 60 * 1000);

  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);

  // Actualizar calendario al cambiar de cabaña
  document.getElementById("cabaña")?.addEventListener("change", () => {
    iniciarCalendarioBooking(reservasGlobal, mesBase);
  });
});
