// ================= MAIN.JS COMPLETO =================

// ===== FORMATEO FECHA LOCAL (d/m/Y) =====
// Convierte un objeto Date en formato 'dd/mm/yyyy'
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// ===== CARGAR RESERVAS DESDE BACKEND =====
// El backend devuelve reservas de cada cabaña {campanilla: [...], tejo: [...]}
// Se asegura que estén en formato ISO 'YYYY-MM-DD' para poder compararlas con dataset.fecha del calendario
const BACKEND_URL = "https://rafaellabandeira.github.io.onrender.com/reservas";

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

// ===== VARIABLES GLOBALES DEL CALENDARIO =====
let mesBase = new Date();          // Mes actualmente visible en el calendario
let reservasGlobal = {};           // Contiene reservas actuales cargadas desde backend
let inicioSeleccion = null;        // Fecha de inicio de la selección
let finSeleccion = null;           // Fecha de fin de la selección

// ===== INICIAR CALENDARIO TIPO BOOKING =====
function iniciarCalendarioBooking(fechasOcupadas, fechaBase = new Date()) {
  const container = document.getElementById("fechas");
  if (!container) return;
  container.innerHTML = "";        // Limpia calendario antes de dibujar

  reservasGlobal = fechasOcupadas;

  // Función para crear un mes completo
  function crearMes(ano, mes) {
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const mesContainer = document.createElement("div");
    mesContainer.classList.add("mes-calendario");
    mesContainer.style.marginRight = "10px";

    // ===== Título del mes =====
    const tituloMes = document.createElement("div");
    tituloMes.classList.add("titulo-mes");
    tituloMes.innerText = primerDia.toLocaleString("es-ES", { month: "long", year: "numeric" });
    mesContainer.appendChild(tituloMes);

    // ===== Fila de días de la semana =====
    const diasSemana = ["L","M","X","J","V","S","D"];
    diasSemana.forEach(dia => {
      const dElem = document.createElement("div");
      dElem.classList.add("dia-semana");
      dElem.innerText = dia;
      mesContainer.appendChild(dElem);
    });

    // ===== Espacios en blanco antes del primer día del mes =====
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1; // lunes=0
    for (let i = 0; i < primerDiaSemana; i++) {
      const empty = document.createElement("div");
      empty.classList.add("fila-dia", "empty-dia");
      mesContainer.appendChild(empty);
    }

    // ===== Días del mes =====
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = new Date(ano, mes, d);
      const diaElem = document.createElement("div");
      diaElem.classList.add("fila-dia");
      diaElem.innerText = d;
      diaElem.dataset.fecha = fecha.toISOString().slice(0,10);

      // Día pasado
      if (fecha < new Date(new Date().setHours(0,0,0,0))) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // Día reservado por backend (Airbnb sincronizado)
      const fechaISO = fecha.toISOString().slice(0,10);
      const cabana = document.getElementById("cabaña")?.value.toLowerCase();
      if (reservasGlobal[cabana]?.includes(fechaISO)) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // ===== Selección de fechas =====
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

        // Marca rango seleccionado visualmente
        const dias = mesContainer.querySelectorAll(".fila-dia");
        dias.forEach(d => d.classList.remove("seleccionado"));
        dias.forEach(d => {
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

document.getElementById("mesAnterior")?.addEventListener("click", () => {
  mesBase.setMonth(mesBase.getMonth() - 1);
  refrescarCalendario();
});
document.getElementById("mesSiguiente")?.addEventListener("click", () => {
  mesBase.setMonth(mesBase.getMonth() + 1);
  refrescarCalendario();
});

// ===== CALCULO DE RESERVA COMPLETO =====
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

    // ===== Cálculo de precio =====
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

    // Aplicar descuentos
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

// ===== CALCULO TEMPORADA ALTA =====
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

// ===== INICIALIZACIÓN GENERAL =====
document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initCarousel(".carousel-container", ".carousel-slide", ".prev", ".next", ".indicator");
  initCarousel(".carousel-container-general", ".carousel-slide-general", ".prev-general", ".next-general", ".indicator-general");

  // ===== Función para actualizar reservas y refrescar calendario =====
  async function actualizarReservas() {
    const reservas = await cargarReservasBackend();
    reservasGlobal = reservas;
    actualizarUrgencia(reservas);
    if (document.getElementById("cabaña") && document.getElementById("fechas")) {
      iniciarCalendarioBooking(reservasGlobal);
    }
  }

  // Carga inicial
  await actualizarReservas();

  // Actualizar cada 2 horas automáticamente
  setInterval(actualizarReservas, 2 * 60 * 60 * 1000);

  // Botones de cálculo y pago
  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);

  // Actualizar calendario al cambiar de cabaña
  document.getElementById("cabaña")?.addEventListener("change", () => {
    iniciarCalendarioBooking(reservasGlobal);
  });
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
