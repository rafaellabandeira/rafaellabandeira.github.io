// js/main.js

// Espera a que el DOM cargue
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Sitio Cabañas Río Mundo cargado");

  // Inicializa carruseles y menú
  initCarousel();
  initHamburger();

  // Cargar fechas ocupadas desde el backend (Render)
  const reservas = await cargarReservas();

  console.log("Fechas ocupadas cargadas:", reservas);

  // Inicializar la lógica de bloqueo de fechas
  bloquearFechas(reservas);

  // Configurar cálculo de reserva
  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- FUNCIONES ---------------------

async function cargarReservas() {
  try {
    // 🔴 ESTA ES LA CLAVE: llamar a tu backend real de Render
    const res = await fetch("https://rafaellabandeira-github-io.onrender.com/reservas");

    if (!res.ok) throw new Error("No se pudieron cargar las reservas");

    const data = await res.json();

    return data.campanilla || [];
  } catch (err) {
    console.error("Error cargando reservas:", err);
    return [];
  }
}

function bloquearFechas(fechasOcupadas) {
  const inputEntrada = document.getElementById("entrada");
  const inputSalida = document.getElementById("salida");

  function isOcupado(fecha) {
    return fechasOcupadas.includes(fecha);
  }

  // Función para validar que la fecha no esté ocupada
  function validarFecha(e) {
    const valor = e.target.value;
    if (isOcupado(valor)) {
      alert("Esta fecha está ocupada, elige otra.");
      e.target.value = "";
    }
  }

  inputEntrada.addEventListener("change", validarFecha);
  inputSalida.addEventListener("change", validarFecha);
}

// --------------------- CÁLCULO DE RESERVA ---------------------

function esTemporadaAlta(fecha){
  const f = new Date(fecha);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function incluyeFinDeSemana(fechaEntrada, noches){
  for(let i = 0; i < noches; i++){
    const d = new Date(fechaEntrada);
    d.setDate(d.getDate() + i);
    if(d.getDay() === 5 || d.getDay() === 6) return true;
  }
  return false;
}

function calcularReserva(){
  const cabaña = document.getElementById("cabaña").value;
  const entrada = document.getElementById("entrada").value;
  const salida = document.getElementById("salida").value;
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  if(!entrada || !salida){ alert("Selecciona fechas"); return; }
  if(!nombre || !telefono || !email){ alert("Completa todos los datos personales"); return; }

  const spinner = document.getElementById("spinner");
  const resultado = document.getElementById("resultado");

  spinner.style.display = "block";
  resultado.style.display = "none";

  setTimeout(() => {
    const noches = (new Date(salida) - new Date(entrada)) / (1000*60*60*24);
    let precioNoche = 0;
    if(cabaña === "campanilla"){ precioNoche = esTemporadaAlta(entrada) ? 150 : 115; }
    else { precioNoche = esTemporadaAlta(entrada) ? 120 : 95; }

    if(esTemporadaAlta(entrada) && noches < 4){ alert("En temporada alta mínimo 4 noches"); spinner.style.display="none"; return; }
    if(!esTemporadaAlta(entrada) && noches < 2){ alert("Mínimo 2 noches"); spinner.style.display="none"; return; }

    let total = noches * precioNoche;
    let descuento = 0;

    if(!esTemporadaAlta(entrada) && noches >= 3 && !incluyeFinDeSemana(entrada, noches)){
      descuento = total * 0.10;
      total *= 0.90;
    }
    if(esTemporadaAlta(entrada) && noches >= 6){
      descuento = total * 0.10;
      total *= 0.90;
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
    function show(n){ slides.forEach(s=>s.classList.remove("active")); slides[n].classList.add("active"); }
    show(0);
    setInterval(()=>{ current = (current+1)%slides.length; show(current); }, 5000);
  });
}

// --------------------- MENÚ HAMBURGUESA ---------------------

function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");
  if(!hamburger) return;
  hamburger.addEventListener("click", ()=>{ hamburger.classList.toggle("active"); navMenu.classList.toggle("active"); });
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", ()=>{ hamburger.classList.remove("active"); navMenu.classList.remove("active"); });
  });
}
