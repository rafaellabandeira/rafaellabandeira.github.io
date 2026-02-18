// main.js
import flatpickr from "flatpickr";

document.addEventListener("DOMContentLoaded", async () => {
  initCarousel();
  initHamburger();

  const reservas = await cargarReservas();
  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGAR RESERVAS ---------------------
async function cargarReservas() {
  try {
    const res = await fetch("/reservas");
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    return await res.json();
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// --------------------- CALENDARIO / BLOQUEO ---------------------
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
    const cabaña = document.getElementById("cabaña").value;

    while (actual < fin) {
      const fechaISO = actual.toISOString().split("T")[0];
      if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
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
    locale: { firstDayOfWeek: 1 },
    onChange: actualizarAviso,
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      const cabaña = document.getElementById("cabaña").value;
      const fecha = dayElem.dateObj.toISOString().split("T")[0];

      if (fechasOcupadas[cabaña]?.includes(fecha)) {
        dayElem.classList.add("ocupado"); // rojo
      }
    }
  });

  flatpickr("#salida", {
    dateFormat: "Y-m-d",
    minDate: "today",
    locale: { firstDayOfWeek: 1 },
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      const cabaña = document.getElementById("cabaña").value;
      const fecha = dayElem.dateObj.toISOString().split("T")[0];
      if (fechasOcupadas[cabaña]?.includes(fecha)) {
        dayElem.classList.add("ocupado"); // rojo
      }
    }
  });
}

// --------------------- PRECIO Y RESERVA ---------------------
function esTemporadaAlta(fecha) {
  const f = new Date(fecha);
  const mes = f.getMonth() + 1;
  const dia = f.getDate();
  return (mes === 7 || mes === 8) || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
}

function calcularReserva() {
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
    const fechaEntrada = new Date(entrada);
    let minNoches, precioNoche;

    if (esTemporadaAlta(entrada)) {
      minNoches = 4;
      precioNoche = cabaña === "campanilla" ? 150 : 140;
    } else {
      minNoches = 2;
      const diaSemana = fechaEntrada.getDay();
      if (diaSemana === 5 || diaSemana === 6) { // viernes o sábado
        precioNoche = cabaña === "campanilla" ? 150 : 140;
      } else {
        precioNoche = cabaña === "campanilla" ? 115 : 110;
      }
    }

    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    let total = noches * precioNoche;
    let descuento = 0;

    if (!esTemporadaAlta(entrada) && noches >= 3) { descuento = total*0.10; total*=0.90; }
    if (esTemporadaAlta(entrada) && noches >= 6) { descuento = total*0.10; total*=0.90; }

    const resto = total - 50;

    // colores de cada cabaña
    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");

    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("resto").innerText = resto.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 500);
}

function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- CARRUSEL / MENÚ ---------------------
function initCarousel() { /* tu código de carrusel */ }
function initHamburger() { /* tu código de menú hamburguesa */ }
