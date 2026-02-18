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

// Detecta si un día concreto es temporada alta
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const diaSemana = fecha.getDay(); // 5 viernes | 6 sábado

  // Fin de semana = temporada alta
  if (diaSemana === 5 || diaSemana === 6) return true;

  // Julio y Agosto
  if (mes === 7 || mes === 8) return true;

  // Navidad
  if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 7)) return true;

  return false;
}


// Precio real por noche según reglas
function obtenerPrecioPorNoche(fecha, cabaña) {

  if (esTemporadaAlta(fecha)) {
    if (cabaña === "campanilla") return 150;
    if (cabaña === "tejo") return 140;
  }

  return 110; // temporada baja
}

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
    const entradaDate = new Date(entrada);
    const salidaDate = new Date(salida);

    let total = 0;
    let noches = 0;
    let hayAlta = false;
    let hayBaja = false;

    for (let d = new Date(entradaDate); d < salidaDate; d.setDate(d.getDate() + 1)) {

      const fechaActual = new Date(d);

      if (esTemporadaAlta(fechaActual)) hayAlta = true;
      else hayBaja = true;

      total += obtenerPrecioPorNoche(fechaActual, cabaña);
      noches++;
    }

    // ---------------- VALIDACIONES ----------------

    if (noches < 2) {
      alert("La estancia mínima es de 2 noches");
      spinner.style.display="none";
      return;
    }

    // Alta real (verano / navidad)
    const mesEntrada = entradaDate.getMonth()+1;
    const diaEntrada = entradaDate.getDate();

    const altaReal =
      (mesEntrada === 7 || mesEntrada === 8) ||
      ((mesEntrada === 12 && diaEntrada >= 22) ||
       (mesEntrada === 1 && diaEntrada <= 7));

    if (altaReal && noches < 4) {
      alert("En temporada alta la estancia mínima es de 4 noches");
      spinner.style.display="none";
      return;
    }

    // ---------------- DESCUENTOS ----------------

    let descuento = 0;

    if (!hayAlta && noches >= 3) {
      descuento = total * 0.10;
    }

    if (hayAlta && noches > 6) {
      descuento = total * 0.10;
    }

    total -= descuento;

    const resto = total - 50;
    
