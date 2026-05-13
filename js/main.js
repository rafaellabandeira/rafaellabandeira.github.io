// ================= MAIN.JS COMPLETO - RÍO MUNDO =================

function fechaLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const BACKEND_URL = "https://rafaellabandeira-github-io.onrender.com/reservas";

async function cargarReservasBackend() {
  try {
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("Error");
    const data = await res.json();
    const reservas = { campanilla: [], tejo: [], bloqueos_campanilla: [], bloqueos_tejo: [] };
    for (let cabana of ["campanilla", "tejo"]) {
      reservas[cabana] = data[cabana]?.map(f => f.slice(0, 10)) || [];
    }
    reservas.bloqueos_campanilla = data.bloqueados_campanilla || [];
    reservas.bloqueos_tejo = data.bloqueados_tejo || [];
    return reservas;
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [], bloqueos_campanilla: [], bloqueos_tejo: [] };
  }
}

async function guardarBloqueoEnBackend(fecha, bloquear, cabaña) {
  try {
    await fetch(BACKEND_URL, {
      method: bloquear ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, cabaña })
    });
  } catch (err) { console.error(err); }
}

let reservasGlobal = {};
let fechasOcupadasFlatpickr = [];
let bloqueosFlatpickr = [];
let flatpickrInstance;
let adminActivo = false;
let rangoInicio = null;
let rangoFin = null;

function esBloqueada(fechaISO) {
  return fechasOcupadasFlatpickr.includes(fechaISO) || bloqueosFlatpickr.includes(fechaISO);
}
function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return fechaLocal(d);
}
function esPrimerDiaBloque(fechaISO) {
  return esBloqueada(fechaISO) && !esBloqueada(sumarDias(fechaISO, -1));
}

function colorearDias(date) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fechaISO = fechaLocal(date);
  const fechaAyer = sumarDias(fechaISO, -1);
  const fechaManana = sumarDias(fechaISO, 1);
  if (date < hoy) return "dia-pasado";
  if (!esBloqueada(fechaISO) && esBloqueada(fechaAyer)) return "dia-salida";
  if (!esBloqueada(fechaISO) && esBloqueada(fechaManana)) return "dia-libre";
  if (!esBloqueada(fechaISO)) return "dia-libre";
  if (esPrimerDiaBloque(fechaISO)) return "dia-entrada-ocupada";
  return "dia-bloqueado";
}

function limpiarSeleccionVisual() {
  document.querySelectorAll(".flatpickr-day").forEach(d => {
    d.classList.remove("startRange", "inRange", "endRange", "selected");
  });
}

function pintarRangoVisual() {
  limpiarSeleccionVisual();
  if (!rangoInicio) return;
  document.querySelectorAll(".flatpickr-day").forEach(d => {
    if (!d.dateObj) return;
    const f = new Date(d.dateObj); f.setHours(0,0,0,0);
    const i = new Date(rangoInicio); i.setHours(0,0,0,0);
    if (f.getTime() === i.getTime()) d.classList.add("startRange", "selected");
    if (rangoFin) {
      const e = new Date(rangoFin); e.setHours(0,0,0,0);
      if (f.getTime() === e.getTime()) d.classList.add("endRange", "selected");
      else if (f > i && f < e) d.classList.add("inRange");
    }
  });
}

function validarRango(inicio, fin) {
  const isoInicio = fechaLocal(inicio);
  const isoFin = fechaLocal(fin);
  if (esBloqueada(isoInicio) && esPrimerDiaBloque(isoInicio)) {
    alert("No puedes iniciar la reserva en ese día."); return false;
  }
  let check = new Date(inicio); check.setDate(check.getDate() + 1);
  while (check < fin) {
    if (esBloqueada(fechaLocal(check))) {
      alert("No puedes seleccionar un rango que incluye fechas ya reservadas."); return false;
    }
    check.setDate(check.getDate() + 1);
  }
  if (esBloqueada(isoFin) && !esPrimerDiaBloque(isoFin)) {
    alert("No puedes terminar la reserva en ese día."); return false;
  }
  return true;
}

function manejarClickDia(dayElem) {
  if (!dayElem || !dayElem.dateObj) return;
  const fecha = new Date(dayElem.dateObj);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fechaISO = fechaLocal(fecha);
  const clase = colorearDias(fecha);

  if (adminActivo) {
    if (fecha < hoy) return;
    const cabaña = document.getElementById("cabaña").value;
    if (bloqueosFlatpickr.includes(fechaISO)) {
      bloqueosFlatpickr = bloqueosFlatpickr.filter(f => f !== fechaISO);
      guardarBloqueoEnBackend(fechaISO, false, cabaña);
    } else if (!fechasOcupadasFlatpickr.includes(fechaISO)) {
      bloqueosFlatpickr.push(fechaISO);
      guardarBloqueoEnBackend(fechaISO, true, cabaña);
    }
    inicializarFlatpickr();
    return;
  }

  if (fecha < hoy) return;
  if (clase === "dia-bloqueado") return;

  // Naranja solo se bloquea como check-in, no como checkout
  if (clase === "dia-entrada-ocupada" && !rangoInicio) return;

  if (!rangoInicio) {
    rangoInicio = new Date(fecha);
    rangoFin = null;
    pintarRangoVisual();
  } else if (!rangoFin) {
    if (fecha <= rangoInicio) {
      rangoInicio = new Date(fecha);
      pintarRangoVisual();
      return;
    }
    if (!validarRango(rangoInicio, fecha)) {
      rangoInicio = null; rangoFin = null;
      limpiarSeleccionVisual();
      return;
    }
    rangoFin = new Date(fecha);
    pintarRangoVisual();
    const opc = { year: "numeric", month: "long", day: "numeric" };
    document.getElementById("fechasSeleccionadas").textContent =
      `${rangoInicio.toLocaleDateString("es-ES", opc)} → ${rangoFin.toLocaleDateString("es-ES", opc)}`;
  } else {
    rangoInicio = null; rangoFin = null;
    limpiarSeleccionVisual();
    document.getElementById("fechasSeleccionadas").textContent = "";
  }
}

function inicializarFlatpickr() {
  if (flatpickrInstance) flatpickrInstance.destroy();
  rangoInicio = null;
  rangoFin = null;

  flatpickrInstance = flatpickr("#calendarioVisible", {
    inline: true,
    mode: "range",
    locale: "es",
    dateFormat: "d-m-Y",

    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const clase = colorearDias(new Date(dayElem.dateObj));
      dayElem.classList.add(clase);
      dayElem.style.pointerEvents = "auto";
    },

    onMonthChange: function() {
      setTimeout(() => pintarRangoVisual(), 10);
    },

    onChange: function() {
      // No hacer nada — el rango se gestiona manualmente
    }
  });

  // Listener delegado en calendarContainer — sobrevive a cambios de mes
  const cal = flatpickrInstance.calendarContainer;
  cal.addEventListener("click", function(e) {
    const dayElem = e.target.closest(".flatpickr-day");
    if (dayElem) {
      e.stopPropagation();
      e.preventDefault();
      manejarClickDia(dayElem);
    }
  }, true); // useCapture=true para interceptar antes que Flatpickr
}

async function prepararFlatpickr() {
  const reservas = await cargarReservasBackend();
  reservasGlobal = reservas;
  const cabaña = document.getElementById("cabaña").value;
  fechasOcupadasFlatpickr = reservas[cabaña] || [];
  bloqueosFlatpickr = cabaña === "campanilla"
    ? reservas.bloqueos_campanilla
    : reservas.bloqueos_tejo;
  inicializarFlatpickr();
}

function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  if (!rangoInicio || !rangoFin) {
    alert("Selecciona un rango de fechas"); return;
  }
  const inicio = rangoInicio, fin = rangoFin;
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
    const opc = { day: "numeric", month: "short" };
    document.getElementById("fechasSeleccionadas").innerHTML =
      `📅 ${inicio.toLocaleDateString("es-ES", opc)} - ${fin.toLocaleDateString("es-ES", opc)}<br>🛏 ${noches} ${noches===1?"noche":"noches"}`;

    const minNoches = esTemporadaAlta(inicio) ? 4 : 2;
    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none"; return;
    }

    let total = 0;
    for (let i = 0; i < noches; i++) {
      const dia = new Date(inicio); dia.setDate(dia.getDate() + i);
      const dow = dia.getDay();
      let precio;
      if (esTemporadaAlta(dia)) precio = 150;
      else precio = (dow === 5 || dow === 6)
        ? (cabaña === "campanilla" ? 150 : 140)
        : (cabaña === "campanilla" ? 115 : 110);
      total += precio;
    }

    let descuento = 0;
    if (noches>=6 && esTemporadaAlta(inicio)) descuento = total*0.10;
    else if (noches>=3 && !esTemporadaAlta(inicio)) descuento = total*0.10;
    total -= descuento;

    document.getElementById("cabañaSeleccionada").innerText =
      cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);
    document.getElementById("resto").innerText = (total-50).toFixed(2);
    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}

function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1, dia = fecha.getDate();
  return (mes === 7 || mes === 8 || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7));
}

function reservar() { alert("Aquí se conectará el pago de 50 €."); }

function actualizarUrgencia(fechasOcupadas) {
  const mensaje = document.getElementById("mensajeUrgencia");
  if (!mensaje) return;
  const mes = new Date().getMonth()+1;
  const ocupadas = fechasOcupadas.campanilla.length;
  let texto = "";
  if (mes===7||mes===8) texto = "🔥 Verano es temporada alta. Te recomendamos reservar pronto.";
  else if (ocupadas>20) texto = "⚡ Quedan pocas fechas disponibles este mes.";
  else if (ocupadas>10) texto = "📅 Este alojamiento suele reservarse rápido.";
  else texto = "✨ Reserva ahora para asegurar tus fechas.";
  mensaje.innerText = texto;
}

function initCarousel(containerSelector, slideSelector, prevSelector, nextSelector, indicatorSelector) {
  document.querySelectorAll(containerSelector).forEach(container => {
    const slides=container.querySelectorAll(slideSelector);
    const prevBtn=container.querySelector(prevSelector);
    const nextBtn=container.querySelector(nextSelector);
    const indicators=container.querySelectorAll(indicatorSelector);
    let currentIndex=0;
    if (!slides.length) return;
    function showSlide(index) {
      slides.forEach((s,i)=>{s.style.display=i===index?"block":"none";});
      indicators.forEach((ind,i)=>{ind.classList.toggle("active",i===index);});
    }
    nextBtn?.addEventListener("click",()=>{currentIndex=(currentIndex+1)%slides.length;showSlide(currentIndex);});
    prevBtn?.addEventListener("click",()=>{currentIndex=(currentIndex-1+slides.length)%slides.length;showSlide(currentIndex);});
    indicators.forEach((ind,i)=>{ind.addEventListener("click",()=>{currentIndex=i;showSlide(currentIndex);});});
    showSlide(currentIndex);
  });
}

function initHamburger() {
  const hamburger=document.getElementById("hamburger");
  const navMenu=document.getElementById("navMenu");
  hamburger?.addEventListener("click",()=>{
    navMenu?.classList.toggle("active");
    hamburger.classList.toggle("active");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initCarousel(".carousel-container",".carousel-slide",".prev",".next",".indicator");
  initCarousel(".carousel-container-general",".carousel-slide-general",".prev-general",".next-general",".indicator-general");

  await prepararFlatpickr();
  actualizarUrgencia(reservasGlobal);

  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);
  document.getElementById("cabaña")?.addEventListener("change", prepararFlatpickr);

  const adminButton = document.getElementById("adminButton");
  adminButton?.addEventListener("click", async () => {
    if (adminActivo) {
      adminActivo = false;
      adminButton.style.backgroundColor = "#444";
      alert("Modo administrador desactivado"); return;
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
      } else { alert("Contraseña incorrecta"); }
    } catch (err) { alert("Error al conectar con el servidor"); }
  });

  setInterval(async()=>{
    const reservas=await cargarReservasBackend();
    actualizarUrgencia(reservas);
  }, 2*60*60*1000);
});
