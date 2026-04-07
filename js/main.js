// ================= MAIN.JS COMPLETO =================

// ===== FORMATEO FECHA LOCAL (Y-m-d) =====
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

    // Aseguramos que exista array de bloqueos
    data.bloqueos = data.bloqueos || [];

    const reservas = { campanilla: [], tejo: [], bloqueos: [] };
    for (let cabana of ["campanilla", "tejo"]) {
      reservas[cabana] = data[cabana]?.map(f => f.slice(0,10)) || [];
    }
    reservas.bloqueos = data.bloqueos || [];
    return reservas;

  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [], bloqueos: [] };
  }
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = {};
let fechasOcupadasFlatpickr = [];
let bloqueosFlatpickr = [];
let flatpickrInstance;
let arrastreActivo = false;
let rangoSeleccionado = [];

// ================================
// 🎯 CALENDARIO FLATPICKR
// ================================

// Asignación de colores
function colorearDias(date) {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const fechaISO = date.toISOString().slice(0, 10);

  if (date < hoy) return "dia-pasado";
  if (fechasOcupadasFlatpickr.includes(fechaISO) || bloqueosFlatpickr.includes(fechaISO)) return "dia-bloqueado";
  return "dia-libre";
}

function inicializarFlatpickr() {
  if (flatpickrInstance) flatpickrInstance.destroy();

  flatpickrInstance = flatpickr("#calendarioVisible", {
    inline: true,
    mode: "range",
    locale: "es",
    dateFormat: "d-m-Y",
    disable: [
      date => fechasOcupadasFlatpickr.includes(date.toISOString().slice(0,10))
    ],
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const fecha = new Date(dayElem.dateObj);
      dayElem.classList.add(colorearDias(fecha));

      // ===== DOBLE CLICK: BLOQUEAR / DESBLOQUEAR =====
      dayElem.addEventListener("dblclick", () => {
        const fechaISO = dayElem.dateObj.toISOString().slice(0, 10);
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (dayElem.dateObj < hoy) return;

        if (bloqueosFlatpickr.includes(fechaISO)) {
          // Desbloquear
          bloqueosFlatpickr = bloqueosFlatpickr.filter(f => f !== fechaISO);
          guardarBloqueoEnBackend(fechaISO, false);
        } else {
          // Bloquear
          bloqueosFlatpickr.push(fechaISO);
          guardarBloqueoEnBackend(fechaISO, true);
        }

        flatpickrInstance.redraw();
      });

      // ===== ARRASTRAR PARA BLOQUEAR RANGO =====
      dayElem.addEventListener("mousedown", () => {
        arrastreActivo = true;
        rangoSeleccionado = [];
      });
      dayElem.addEventListener("mouseenter", () => {
        if (!arrastreActivo) return;
        const fechaISO = dayElem.dateObj.toISOString().slice(0, 10);
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (dayElem.dateObj >= hoy) {
          rangoSeleccionado.push(fechaISO);
          dayElem.style.background = "rgba(255,0,0,0.4)";
        }
      });
      document.addEventListener("mouseup", () => {
        if (!arrastreActivo) return;
        arrastreActivo = false;
        if (rangoSeleccionado.length > 0) {
          rangoSeleccionado.forEach(fecha => {
            if (!bloqueosFlatpickr.includes(fecha)) {
              bloqueosFlatpickr.push(fecha);
              guardarBloqueoEnBackend(fecha, true);
            }
          });
          flatpickrInstance.redraw();
        }
      });
    },
    onChange: function(selectedDates) {
      if (selectedDates.length === 2) {
        const inicio = selectedDates[0];
        const fin = selectedDates[1];
        const opciones = { year: "numeric", month: "long", day: "numeric" };
        const inicioTxt = inicio.toLocaleDateString("es-ES", opciones);
        const finTxt = fin.toLocaleDateString("es-ES", opciones);
        document.getElementById("fechasSeleccionadas").textContent =
          `${inicioTxt} → ${finTxt}`;
      }
    }
  });
}

async function prepararFlatpickr() {
  const reservas = await cargarReservasBackend();
  reservasGlobal = reservas;

  const cabaña = document.getElementById("cabaña").value;
  fechasOcupadasFlatpickr = reservas[cabaña] || [];
  bloqueosFlatpickr = reservas.bloqueos || [];

  inicializarFlatpickr();
}

// ================================
// 🎯 CÁLCULO DE RESERVA
// ================================

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  if (!flatpickrInstance.selectedDates || flatpickrInstance.selectedDates.length < 2) {
    alert("Selecciona un rango de fechas");
    return;
  }
  const inicio = flatpickrInstance.selectedDates[0];
  const fin = flatpickrInstance.selectedDates[1];
  const noches = Math.round((fin - inicio) / (1000*60*60*24));
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!nombre || !telefono || !email) {
    if (!/\S+@\S+\.\S+/.test(email)) alert("Introduce un email válido.");
    else alert("Completa todos los datos personales");
    return;
  }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");

  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const opciones = { day: "numeric", month: "short" };
    const inicioTexto = inicio.toLocaleDateString("es-ES", opciones);
    const finTexto = fin.toLocaleDateString("es-ES", opciones);

    document.getElementById("fechasSeleccionadas").innerHTML =
      `📅 ${inicioTexto} - ${finTexto}<br>🛏 ${noches} ${noches === 1 ? "noche" : "noches"}`;

    let total = 0;
    let descuento = 0;
    let minNoches = esTemporadaAlta(inicio) ? 4 : 2;

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    for (let i = 0; i < noches; i++) {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      const dow = dia.getDay();
      let precio;

      if (esTemporadaAlta(dia)) precio = 150;
      else precio = (dow === 5 || dow === 6)
        ? (cabaña === "campanilla" ? 150 : 140)
        : (cabaña === "campanilla" ? 115 : 110);

      total += precio;
    }

    if (noches >= 6 && esTemporadaAlta(inicio)) descuento = total * 0.10;
    else if (noches >= 3 && !esTemporadaAlta(inicio)) descuento = total * 0.10;
    total -= descuento;

    document.getElementById("cabañaSeleccionada").innerText =
      cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";

    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    const pagoInicial = 50;
    document.getElementById("resto").innerText =
      (total - pagoInicial).toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";

  }, 300);
}

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

function reservar() {
  alert("Aquí se conectará el pago de 50 €.");
}

// ================================
// URGENCIA
// ================================

function actualizarUrgencia(fechasOcupadas){
  const mensaje = document.getElementById("mensajeUrgencia");
  if(!mensaje) return;
  const hoy = new Date();
  const mesActual = hoy.getMonth()+1;
  const ocupadas = fechasOcupadas.campanilla.length;
  let texto = "";
  if(mesActual === 7 || mesActual === 8) texto = "🔥 Verano es temporada alta. Te recomendamos reservar pronto.";
  else if(ocupadas > 20) texto = "⚡ Quedan pocas fechas disponibles este mes.";
  else if(ocupadas > 10) texto = "📅 Este alojamiento suele reservarse rápido.";
  else texto = "✨ Reserva ahora para asegurar tus fechas.";
  mensaje.innerText = texto;
}

// ================================
// GUARDAR BLOQUEOS EN BACKEND (JSON de reservas) 
// ================================
async function guardarBloqueoEnBackend(fecha, bloquear) {
  try {
    // Traemos reservas completas
    const res = await fetch(BACKEND_URL);
    const data = await res.json();
    data.bloqueos = data.bloqueos || [];

    if (bloquear) {
      if (!data.bloqueos.includes(fecha)) data.bloqueos.push(fecha);
    } else {
      data.bloqueos = data.bloqueos.filter(f => f !== fecha);
    }

    await fetch(BACKEND_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

  } catch (err) { console.error(err); }
}

// ================================
// CARRUSEL + MENÚ
// ================================
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
      slides.forEach((slide,i)=>{ slide.style.display = i===index?"block":"none"; });
      indicators.forEach((ind,i)=>{ ind.classList.toggle("active", i===index); });
    }

    nextBtn?.addEventListener("click", ()=>{
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    });
    prevBtn?.addEventListener("click", ()=>{
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(currentIndex);
    });
    indicators.forEach((ind,i)=>{ ind.addEventListener("click", ()=>{ currentIndex=i; showSlide(currentIndex); }); });
    showSlide(currentIndex);
  });
}

function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  hamburger?.addEventListener("click", ()=>{
    navMenu?.classList.toggle("active");
    hamburger.classList.toggle("active");
  });
}

// ================================
// 🚀 INICIALIZACIÓN GENERAL
// ================================
document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initCarousel(".carousel-container", ".carousel-slide", ".prev", ".next", ".indicator");
  initCarousel(".carousel-container-general", ".carousel-slide-general", ".prev-general", ".next-general", ".indicator-general");

  await prepararFlatpickr();  
  const reservas = await cargarReservasBackend();
  actualizarUrgencia(reservas);

  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);

  setInterval(async () => {
    const reservas = await cargarReservasBackend();
    actualizarUrgencia(reservas);
  }, 2*60*60*1000);
});
