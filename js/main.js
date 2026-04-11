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

    const reservas = {
      campanilla: [],
      tejo: [],
      bloqueos_campanilla: [],
      bloqueos_tejo: []
    };

    // Cargar las fechas ocupadas de cada cabaña
    for (let cabana of ["campanilla", "tejo"]) {
      reservas[cabana] = data[cabana]?.map(f => f.slice(0, 10)) || [];
    }

    // ✅ Bloqueos independientes por cabaña
    reservas.bloqueos_campanilla = data.bloqueados_campanilla || [];
    reservas.bloqueos_tejo = data.bloqueados_tejo || [];

    return reservas;

  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [], bloqueos_campanilla: [], bloqueos_tejo: [] };
  }
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = {};
let fechasOcupadasFlatpickr = [];
let bloqueosFlatpickr = [];
let flatpickrInstance;
let arrastreActivo = false;
let rangoSeleccionado = [];
let adminActivo = false; // 🔒 modo administrador

// ================================
// 🎯 CALENDARIO FLATPICKR
// ================================

function colorearDias(date) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fechaISO = date.toISOString().slice(0, 10);

  if (date < hoy) return "dia-pasado";
  if (fechasOcupadasFlatpickr.includes(fechaISO) || bloqueosFlatpickr.includes(fechaISO)) return "dia-bloqueado";
  return "dia-libre";
}

// ✅ Un solo listener global para mouseup
document.addEventListener("mouseup", async () => {
  if (!arrastreActivo) return;
  arrastreActivo = false;
  if (rangoSeleccionado.length === 0) return;

  const cabaña = document.getElementById("cabaña").value;

  for (const fecha of rangoSeleccionado) {
    if (!bloqueosFlatpickr.includes(fecha)) {
      bloqueosFlatpickr.push(fecha);
      await guardarBloqueoEnBackend(fecha, true, cabaña);

      flatpickrInstance.days.childNodes.forEach(d => {
        if (d.dateObj && d.dateObj.toISOString().slice(0,10) === fecha) {
          d.classList.remove("dia-libre");
          d.classList.add("dia-bloqueado", "flatpickr-disabled");
        }
      });
    }
  }

  flatpickrInstance.set("disable", [
    date => fechasOcupadasFlatpickr.includes(date.toISOString().slice(0,10)) ||
            bloqueosFlatpickr.includes(date.toISOString().slice(0,10))
  ]);
  flatpickrInstance.redraw();
  rangoSeleccionado = [];
});

function inicializarFlatpickr() {
  if (flatpickrInstance) flatpickrInstance.destroy();

  flatpickrInstance = flatpickr("#calendarioVisible", {
    inline: true,
    mode: "range",
    locale: "es",
    dateFormat: "d-m-Y",

    disable: [
      date => fechasOcupadasFlatpickr.includes(date.toISOString().slice(0,10)) ||
              bloqueosFlatpickr.includes(date.toISOString().slice(0,10))
    ],

    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const fecha = new Date(dayElem.dateObj);
      const clase = colorearDias(fecha);
      dayElem.classList.add(clase);

      if (clase === "dia-bloqueado") {
        dayElem.classList.add("flatpickr-disabled");
      }

      // ===== DOBLE CLICK PARA BLOQUEAR/DESBLOQUEAR (solo admin) =====
      dayElem.addEventListener("dblclick", () => {
        if (!adminActivo) return;
        const fechaISO = dayElem.dateObj.toISOString().slice(0, 10);
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (dayElem.dateObj < hoy) return;

        const cabaña = document.getElementById("cabaña").value;

        if (bloqueosFlatpickr.includes(fechaISO)) {
          // 🔓 Desbloquear
          bloqueosFlatpickr = bloqueosFlatpickr.filter(f => f !== fechaISO);
          guardarBloqueoEnBackend(fechaISO, false, cabaña);

          dayElem.classList.remove("dia-bloqueado", "flatpickr-disabled");
          dayElem.classList.add("dia-libre");
        } else {
          // 🔒 Bloquear
          bloqueosFlatpickr.push(fechaISO);
          guardarBloqueoEnBackend(fechaISO, true, cabaña);

          dayElem.classList.remove("dia-libre");
          dayElem.classList.add("dia-bloqueado", "flatpickr-disabled");
        }

        flatpickrInstance.set('disable', [
          date => fechasOcupadasFlatpickr.includes(date.toISOString().slice(0,10)) ||
                  bloqueosFlatpickr.includes(date.toISOString().slice(0,10))
        ]);
        flatpickrInstance.redraw();
      });

      // ===== ARRASTRAR PARA BLOQUEAR RANGO (solo admin) =====
      dayElem.addEventListener("mousedown", () => {
        if (!adminActivo) return;
        arrastreActivo = true;
        rangoSeleccionado = [];
      });

      dayElem.addEventListener("mouseenter", () => {
        if (!arrastreActivo || !adminActivo) return;
        const fechaISO = dayElem.dateObj.toISOString().slice(0, 10);
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (dayElem.dateObj >= hoy && !bloqueosFlatpickr.includes(fechaISO)) {
          rangoSeleccionado.push(fechaISO);
          dayElem.style.background = "rgba(0,123,255,0.4)";
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

  // ✅ Bloqueos por cabaña
  bloqueosFlatpickr = cabaña === "campanilla"
    ? reservas.bloqueos_campanilla
    : reservas.bloqueos_tejo;

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
// GUARDAR BLOQUEOS EN BACKEND
// ================================
async function guardarBloqueoEnBackend(fecha, bloquear, cabaña) {
  try {
    await fetch(BACKEND_URL, {
      method: bloquear ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      // ✅ Enviamos también la cabaña para bloqueos independientes
      body: JSON.stringify({ fecha, cabaña })
    });
  } catch(err) {
    console.error(err);
  }
}

// ================================
// 🔒 FUNCIONALIDAD DEL CANDADO
// ================================
const adminButton = document.getElementById("adminButton");
adminButton?.addEventListener("click", async () => {
  if (adminActivo) {
    adminActivo = false;
    adminButton.style.backgroundColor = "#444";
    alert("Modo administrador desactivado");
    return;
  }

  const clave = prompt("Introduce la contraseña de administrador:");
  if (!clave) return;

  try {
    const res = await fetch(BACKEND_URL.replace("/reservas", "/admin/verificar"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: clave })
    });

    if (res.ok) {
      adminActivo = true;
      adminButton.style.backgroundColor = "#4caf50";
      alert("Modo administrador activado");
    } else {
      alert("Contraseña incorrecta");
    }
  } catch(err) {
    alert("Error al conectar con el servidor");
  }
});

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
  actualizarUrgencia(reservasGlobal);

  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);

  // ✅ Al cambiar de cabaña, recargar el calendario con sus bloqueos
  document.getElementById("cabaña")?.addEventListener("change", prepararFlatpickr);

  setInterval(async () => {
    const reservas = await cargarReservasBackend();
    actualizarUrgencia(reservas);
  }, 2*60*60*1000);
});
