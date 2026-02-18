 <!-- Flatpickr Calendario -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

// js/main.js

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Sitio Cabañas Río Mundo cargado");

  // Inicializa carruseles y menú
  initCarousel();
  initHamburger();

  // Cargar fechas ocupadas desde el backend (Render)
  const reservas = await cargarReservas();
  console.log("Fechas ocupadas cargadas:", reservas);

  // Inicializar calendario con Flatpickr y bloqueo de fechas
  iniciarCalendarios(reservas);

  // Configurar cálculo de reserva
  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- FUNCIONES ---------------------

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

      // Días ocupados
      if (fechasOcupadas.includes(fecha)) {
        dayElem.classList.add("ocupado"); // color rojo via CSS
      }
    }
  };

  flatpickr("#entrada", opcionesFlatpickr);
  flatpickr("#salida", opcionesFlatpickr);
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
    const noches = (new Date(salida) - new Date(
