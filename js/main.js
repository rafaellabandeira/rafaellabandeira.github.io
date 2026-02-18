// main.js

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Cabañas Río Mundo cargado");

  initCarousel();
  initHamburger();

  const reservas = await cargarReservas();
  console.log("Fechas ocupadas cargadas:", reservas);

  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGA DE RESERVAS ---------------------

async function cargarReservas() {
  try {
    const res = await fetch("/reservas");
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    const data = await res.json();
    return data.campanilla || [];
  } catch (err) {
    console.error("Error cargando reservas:", err);
    return [];
  }
}

// --------------------- CALENDARIO ---------------------

function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso() {
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    if (!entrada || !salida) { aviso.style.display = "none"; return; }

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

  flatpickr("#entrada", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: fechasOcupadas,
    weekStart: 1,
    onChange: actualizarAviso,
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const fecha = dayElem.dateObj.toISOString().split("T")[0];
      if (fechasOcupadas.includes(fecha)) dayElem.classList.add("ocupado");
    }
  });

  flatpickr("#salida", {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: fechasOcupadas,
    weekStart: 1,
    onChange: actualizarAviso,
    onDayCreate: function(dObj, dStr, fp, dayElem) {
      const fecha = dayElem.dateObj.toISOString().split("T")[0];
      if (fechasOcupadas.includes(fecha)) dayElem.classList.add("ocupado");
    }
  });
}

// --------------------- CÁLCULO DE RESERVA ---------------------

function esTemporadaAlta(fecha) {
  const f = new Date(fecha);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  // Julio, agosto y navidad/fin de año
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function esFinDeSemana(fecha) {
  const f = new Date(fecha);
  return f.getDay() === 5 || f.getDay() === 6; // viernes=5, sábado=6
}

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
    const noches = (new Date(salida) - new Date(entrada)) / (1000 * 60 * 60 * 24);
    let precioNoche = 0;

    if (esTemporadaAlta(entrada)) {
      // Temporada alta julio/agosto/navidad
      precioNoche = cabaña === "campanilla" ? 150 : 140;
      if (noches < 4) { alert("En temporada alta mínimo 4 noches"); spinner.style.display = "none"; return; }
    } else {
      // Resto del año
      if (esFinDeSemana(entrada)) {
        precioNoche = cabaña === "campanilla" ? 150 : 140;
      } else {
        precioNoche = cabaña === "campanilla" ? 115 : 110;
      }
      if (noches < 2) { alert("Mínimo 2 noches fuera de temporada alta"); spinner.style.display = "none"; return; }
    }

    let total = noches * precioNoche;
    let descuento = 0;

    // Descuentos
    if (!esTemporadaAlta(entrada) && noches >= 3 && !esFinDeSemana(entrada)) {
      descuento = total * 0.10;
      total *= 0.9;
    }
    if (esTemporadaAlta(entrada) && noches >= 6) {
      descuento = total * 0.10;
      total *= 0.9;
    }

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

function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- CARRUSEL ---------------------

function initCarousel() {
  document.querySelectorAll('.carousel').forEach(carousel => {
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
