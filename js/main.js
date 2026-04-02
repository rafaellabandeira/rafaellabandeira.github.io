// ===== FORMATEO FECHA LOCAL =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `\( {y}- \){m}-${d}`;
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = { campanilla: [], tejo: [], bloqueados: [] };
let mesBase = new Date();
let inicioSeleccion = null;
let finSeleccion = null;
let modoAdmin = false;

// ===== CARGAR RESERVAS =====
function cargarReservasLocal() {
  const data = localStorage.getItem("reservasGlobal");
  if (data) {
    reservasGlobal = JSON.parse(data);
    if (!reservasGlobal.bloqueados) reservasGlobal.bloqueados = [];
  }
}

// ===== GUARDAR RESERVAS =====
function guardarReservasLocal() {
  localStorage.setItem("reservasGlobal", JSON.stringify(reservasGlobal));
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 7 || mes === 8 || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7));
}

// ===== CALCULAR RESERVA SEGURA =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const diasSeleccionados = document.querySelectorAll(".fila-dia.seleccionado");

  if (!diasSeleccionados.length) {
    alert("Selecciona un rango de fechas");
    return;
  }

  const bloqueados = Array.from(diasSeleccionados).some(d => d.classList.contains("reservado"));
  if (bloqueados) {
    alert("Algunas de las fechas seleccionadas no están disponibles");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  if (!nombre || !telefono || !email) {
    alert("Completa todos los datos");
    return;
  }

  let total = 0;
  const fechas = Array.from(diasSeleccionados).map(d => new Date(d.dataset.fecha));
  fechas.sort((a, b) => a - b);

  const fechaEntrada = fechas[0];
  const fechaSalida = new Date(fechas[fechas.length - 1]);
  fechaSalida.setDate(fechaSalida.getDate() + 1);

  const noches = (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24);

  for (let i = 0; i < noches; i++) {
    const dia = new Date(fechaEntrada);
    dia.setDate(dia.getDate() + i);

    const dow = dia.getDay();
    let precio;

    if (esTemporadaAlta(dia)) {
      precio = 150;
    } else {
      precio = (dow === 5 || dow === 6)
        ? (cabaña === "campanilla" ? 150 : 140)
        : (cabaña === "campanilla" ? 115 : 110);
    }

    total += precio;
  }

  let descuento = 0;
  if (noches >= 6 && esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;
  else if (noches >= 3 && !esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;

  total -= descuento;

  const opciones = { day: "numeric", month: "short" };

  document.getElementById("fechasSeleccionadas").innerHTML =
    `📅 ${fechaEntrada.toLocaleDateString("es-ES", opciones)} - ${fechaSalida.toLocaleDateString("es-ES", opciones)}<br>
     🛏 ${noches} noches`;

  document.getElementById("cabañaSeleccionada").innerText =
    cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total - 50).toFixed(2);

  document.getElementById("resultado").style.display = "block";
}

// ===== SELECCIÓN RANGO =====
function seleccionarFecha(fecha) {
  if (modoAdmin) return;

  const todosDias = document.querySelectorAll(".fila-dia");
  const diaBloqueado = Array.from(todosDias).find(d => 
    new Date(d.dataset.fecha).getTime() === fecha.getTime() && 
    d.classList.contains("reservado")
  );
  if (diaBloqueado) return;

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

  todosDias.forEach(d => d.classList.remove("seleccionado"));

  todosDias.forEach(d => {
    const f = new Date(d.dataset.fecha);
    if (inicioSeleccion && finSeleccion && f >= inicioSeleccion && f <= finSeleccion) {
      if (!d.classList.contains("reservado")) {
        d.classList.add("seleccionado");
      }
    }
  });
}

// ===== GENERAR MES =====
function generarMes(baseDate) {
  const primerDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

  const mesContainer = document.createElement("div");
  mesContainer.classList.add("mes-calendario");

  const titulo = document.createElement("div");
  titulo.classList.add("titulo-mes");
  titulo.innerText = baseDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();
  mesContainer.appendChild(titulo);

  ["L", "M", "X", "J", "V", "S", "D"].forEach(dia => {
    const dElem = document.createElement("div");
    dElem.classList.add("dia-semana");
    dElem.innerText = dia;
    mesContainer.appendChild(dElem);
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let primerDiaSemana = primerDia.getDay();
  primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  for (let i = 0; i < primerDiaSemana; i++) {
    const empty = document.createElement("div");
    empty.classList.add("fila-dia", "empty-dia");
    mesContainer.appendChild(empty);
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
    const diaElem = document.createElement("div");
    diaElem.classList.add("fila-dia");
    diaElem.dataset.fecha = formatearLocal(fecha);
    diaElem.innerText = d;

    if (fecha < hoy) diaElem.classList.add("reservado");

    const cabaña = document.getElementById("cabaña").value;

    if (
      reservasGlobal[cabaña]?.includes(diaElem.dataset.fecha) ||
      reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)
    ) {
      diaElem.classList.add("reservado");
    }

    diaElem.addEventListener("click", () => {
      if (!diaElem.classList.contains("reservado")) {
        seleccionarFecha(fecha);
      } else if (modoAdmin) {
        if (reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)) {
          reservasGlobal.bloqueados = reservasGlobal.bloqueados.filter(f => f !== diaElem.dataset.fecha);
        } else {
          reservasGlobal.bloqueados.push(diaElem.dataset.fecha);
        }
        guardarReservasLocal();
        iniciarCalendario();
      }
    });

    mesContainer.appendChild(diaElem);
  }

  return mesContainer;
}

// ===== CALENDARIO PRINCIPAL =====
function iniciarCalendario() {
  const container = document.getElementById("fechas");
  container.innerHTML = "";

  const nav = document.createElement("div");
  nav.classList.add("nav-meses");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("btn-nav");
  prevBtn.innerText = "◀";

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("btn-nav");
  nextBtn.innerText = "▶";

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);
  container.appendChild(nav);

  const mesDiv = document.createElement("div");
  mesDiv.id = "meses-container";
  container.appendChild(mesDiv);

  function renderMes() {
    mesDiv.innerHTML = "";
    mesDiv.appendChild(generarMes(mesBase));
  }

  prevBtn.addEventListener("click", () => {
    mesBase.setMonth(mesBase.getMonth() - 1);
    renderMes();
  });

  nextBtn.addEventListener("click", () => {
    mesBase.setMonth(mesBase.getMonth() + 1);
    renderMes();
  });

  renderMes();
}

// ===== CARRUSELES (VERSIÓN MEJORADA - SLIDE) =====
function iniciarCarruseles() {
  const carousels = document.querySelectorAll(".carousel-container-general");

  carousels.forEach(container => {
    const track = container.querySelector(".carousel-general-slides");
    const slides = container.querySelectorAll(".carousel-slide-general");
    const prevBtn = container.querySelector(".prev-general");
    const nextBtn = container.querySelector(".next-general");
    const indicatorsContainer = container.querySelector(".carousel-indicators-general");

    if (!track || slides.length <= 1) return;

    let currentIndex = 0;
    let autoplayInterval = null;
    const autoplayTime = 5000; // 5 segundos

    // Preparar el track para movimiento horizontal
    track.style.display = "flex";
    track.style.transition = "transform 0.6s ease-in-out";

    slides.forEach(slide => {
      slide.style.minWidth = "100%";
      slide.style.flexShrink = "0";
    });

    // Crear indicadores
    if (indicatorsContainer) {
      indicatorsContainer.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.classList.add("indicator-general");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goToSlide(i));
        indicatorsContainer.appendChild(dot);
      });
    }

    function updateIndicators() {
      const dots = indicatorsContainer?.querySelectorAll(".indicator-general");
      dots?.forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
    }

    function goToSlide(index) {
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      updateIndicators();
    }

    // Botones
    prevBtn?.addEventListener("click", () => {
      goToSlide(currentIndex - 1);
      resetAutoplay();
    });

    nextBtn?.addEventListener("click", () => {
      goToSlide(currentIndex + 1);
      resetAutoplay();
    });

    // Autoplay
    function startAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
      autoplayInterval = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, autoplayTime);
    }

    function resetAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
      startAutoplay();
    }

    // Pausar autoplay al pasar el ratón
    container.addEventListener("mouseenter", () => {
      if (autoplayInterval) clearInterval(autoplayInterval);
    });
    container.addEventListener("mouseleave", startAutoplay);

    // Iniciar carrusel
    goToSlide(0);
    startAutoplay();
  });
}

// ===== ADMIN =====
function iniciarAdmin() {
  const btn = document.getElementById("adminButton");
  btn.addEventListener("click", () => {
    const pwd = prompt("Introduce la contraseña de administración");
    if (pwd === "8111") {
      modoAdmin = !modoAdmin;
      alert(`Modo administrador ${modoAdmin ? "activado" : "desactivado"}`);
    } else {
      alert("Contraseña incorrecta");
    }
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  cargarReservasLocal();
  iniciarCalendario();
  iniciarCarruseles();     // ← Carrusel mejorado
  iniciarAdmin();

  document.getElementById("cabaña")?.addEventListener("change", iniciarCalendario);
  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
});
