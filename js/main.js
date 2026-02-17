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
      if (fechasOcupadas.includes(fecha)) {
        dayElem.classList.add("ocupado");
      }
    }
  };

  flatpickr("#entrada", opcionesFlatpickr);
  flatpickr("#salida", opcionesFlatpickr);
}

// --------------------- PRECIO DINÁMICO ---------------------

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

// Devuelve el precio real de un día según cabaña y temporada
function obtenerPrecioPorFecha(fecha, cabaña){
  const f = new Date(fecha);
  const mes = f.getMonth() + 1;
  const diaSemana = f.getDay();

  if(cabaña === "campanilla"){
    if(esTemporadaAlta(fecha)) return 150;
    else return 115;
  } else {
    if(esTemporadaAlta(fecha)) return 120;
    else return 95;
  }
}

function calcularTotalEstancia(entrada, salida, cabaña){
  let total = 0;
  let noches = 0;
  let actual = new Date(entrada);
  const fin = new Date(salida);

  while(actual < fin){
    const fechaISO = actual.toISOString().split("T")[0];
    total += obtenerPrecioPorFecha(fechaISO, cabaña);
    noches++;
    actual.setDate(actual.getDate() + 1);
  }

  // Aplicar descuentos según reglas actuales
  let descuento = 0;
  if(!esTemporadaAlta(entrada) && noches >= 3 &&
