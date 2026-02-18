 <!-- Flatpickr Calendario -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

// js/main.js

// --------------------- INICIALIZACIÓN ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Sitio Cabañas Río Mundo cargado");

  // Inicializa carruseles y menú
  initCarousel();
  initHamburger();

  // Cargar fechas ocupadas desde el backend (Render)
  const reservas = await cargarReservas();
  console.log("Fechas ocupadas cargadas:", reservas);

  // Inicializar calendario con bloqueo de fechas
  iniciarCalendarios(reservas);

  // Configurar botones
  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGA DE RESERVAS ---------------------
async function cargarReservas() {
  try {
    const res = await fetch("https://rafaellabandeira-github-io.onrender.com/reservas");
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    const data = await res.json();
    return data.campanilla || [];
  } catch (err) {
    console.error("Error cargando reservas:", err);
    return [];
  }
}

// --------------------- CALENDARIO / BLOQUEO DE FECHAS ---------------------
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso() {
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = actual.toISOString().split("T")[0];
      if (fechasOcupadas.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  const opcionesFlatpickr = {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: fechasOcupadas,
    onChange: actualizarAviso,
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const fecha = dayElem.dateObj.toISOString().split("T")[0];
      if (fechasOcupadas.includes(fecha)) {
        dayElem.classList.add("ocupado"); // color rojo vía CSS
      }
    }
  };

  flatpickr("#entrada", opcionesFlatpickr);
  flatpickr("#salida", opcionesFlatpickr);
}

// --------------------- PRECIOS ---------------------
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const diaSemana = fecha.getDay(); // 0=domingo ... 5=viernes, 6=sábado

  // Viernes y sábado → temporada alta
  if (diaSemana === 5 || diaSemana === 6) return true;

  // Julio y Agosto → temporada alta
  if (mes === 7 || mes === 8) return true;

  // Navidad 22 dic - 7 ene → temporada alta
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 7)) return true;

  return false;
}

function obtenerPrecioPorNoche(fecha, cabaña) {
  const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes ... 5=viernes, 6=sábado

  // Viernes y sábado → temporada alta
  if (diaSemana === 5 || diaSemana === 6) {
    return cabaña === "campanilla" ? 150 : 140;
  }

  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  // Julio y agosto → temporada alta
  if (mes === 7 || mes === 8) {
    return cabaña === "campanilla" ? 150 : 140;
  }

  // Navidad 22 dic - 7 ene → temporada alta
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 7)) {
    return cabaña === "campanilla" ? 150 : 140;
  }

  // Todo lo demás → temporada baja
  return 110;
}

// --------------------- CÁLCULO DE RESERVA ---------------------
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!entrada || !salida) { alert("Selecciona fechas"); return; }
  if (!nombre || !telefono || !email) { alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");

  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const entradaDate = new Date(entrada);
    const salidaDate = new Date(salida);

    let total = 0;
    let noches = 0;
    let hayAlta = false;
    let hayBaja = false;

    for (let d = new Date(entradaDate); d < salidaDate; d.setDate(d.getDate() + 1)) {
      total += obtenerPrecioPorNoche(new Date(d), cabaña);
      noches++;
      if (esTemporadaAlta(new Date(d))) hayAlta = true;
      else hayBaja = true;
    }

    // Mínima estancia
    if (hayAlta && noches < 4) { alert("En temporada alta, mínimo 4 noches"); spinner.style.display="none"; return; }
    if (!hayAlta && noches < 2) { alert("En temporada baja, mínimo 2 noches"); spinner.style.display="none"; return; }

    // Descuentos
    let descuento = 0;
    if (!hayAlta && noches >= 3) { descuento = total * 0.10; total *= 0.90; }
    if (hayAlta && noches > 6) { descuento = total * 0.10; total *= 0.90; }

    const resto = total - 50;

    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("resto").innerText = resto.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");
    spinner.style.display = "none";
    resultado.style.display = "block";

  }, 600);
}

// --------------------- RESERVA / PAGO ---------------------
async function reservar() {
  const nombre = document.getElementById("nombre").value;
  const telefono = document.getElementById("telefono").value;
  const cabaña = document.getElementById("cabaña").value;

  alert(`Reserva confirmada: ${cabaña}\nNombre: ${nombre}\nTeléfono: ${telefono}\nSeñal de 50 € pagada`);
  location.reload();
}

// --------------------- CARRUSEL ---------------------
function initCarousel() {
  const carousels = document.querySelectorAll('.carousel');
  carousels.forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    let current = 0;
    function show(n) { slides.forEach(s => s.classList.remove("active")); slides[n].classList.add("active"); }
    show(0);
    setInterval(() => { current = (current + 1) % slides.length; show(current); }, 5000);
  });
}

// --------------------- MENÚ HAMBURGUESA ---------------------
function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  if (!hamburger) return;
  hamburger.addEventListener("click", () => { hamburger.classList.toggle("active"); navMenu.classList.toggle("active"); });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => { hamburger.classList.remove("active"); navMenu.classList.remove("active"); });
  });
}
