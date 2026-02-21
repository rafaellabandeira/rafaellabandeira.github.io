// Flatpickr viene desde el CDN del HTML (NO usar imports)

// --------------------- UTIL ---------------------
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  return (
    mes === 7 || mes === 8 ||
    (mes === 12 && dia >= 22) ||
    (mes === 1 && dia <= 7)
  );
}

// --------------------- INIT ---------------------
document.addEventListener("DOMContentLoaded", async () => {
  const reservas = await cargarReservas();
  iniciarCalendarios(reservas);

  document.getElementById("btnCalcular").addEventListener("click", calcularReserva);
  document.getElementById("btnPagar").addEventListener("click", reservar);
});

// --------------------- CARGAR RESERVAS ---------------------
async function cargarReservas() {
  try {
    const res = await fetch("/reservas");
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    // sin backend todavía → vacío
    return { campanilla: [], tejo: [] };
  }
}

// --------------------- CALENDARIO ---------------------
function iniciarCalendarios(fechasOcupadas) {

  function pintarDias(instance) {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    instance.days.childNodes.forEach(dayElem => {
      if (!dayElem.dateObj) return;

      const fechaISO = formatearLocal(dayElem.dateObj);

      dayElem.style.background = "";
      dayElem.style.color = "";
      dayElem.style.pointerEvents = "";

      // pasado → negro
      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }

      // reservado → rojo
      else if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }

      // disponible → verde
      else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
      }

      dayElem.style.borderRadius = "6px";
    });
  }

  const config = {
    mode: "range",
    dateFormat: "d/m/Y",
    minDate: "today",
    locale: "es",

    disable: [
      function(date) {
        const cabaña = document.getElementById("cabaña").value.toLowerCase();
        const fechaISO = formatearLocal(date);
        return fechasOcupadas[cabaña]?.includes(fechaISO);
      }
    ],

    onReady: (s, d, instance) => pintarDias(instance),
    onMonthChange: (s, d, instance) => pintarDias(instance),
    onChange: (s, d, instance) => pintarDias(instance)
  };

  const fpEntrada = flatpickr("#entrada", config);
  const fpSalida  = flatpickr("#salida", config);

  document.getElementById("cabaña").addEventListener("change", () => {
    fpEntrada.redraw();
    fpSalida.redraw();
  });
}

// --------------------- CALCULAR PRECIO ---------------------
function calcularReserva() {

  const cabaña = document.getElementById("cabaña").value;
  const entradaStr = document.getElementById("entrada").value;
  const salidaStr = document.getElementById("salida").value;

  if (!entradaStr || !salidaStr) {
    alert("Selecciona fechas");
    return;
  }

  const [d, m, y] = entradaStr.split("/");
  const fechaEntrada = new Date(`${y}-${m}-${d}`);

  const [ds, ms, ys] = salidaStr.split("/");
  const fechaSalida = new Date(`${ys}-${ms}-${ds}`);

  const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);

  let total = 0;

  for (let i = 0; i < noches; i++) {
    const dia = new Date(fechaEntrada);
    dia.setDate(dia.getDate() + i);

    const dow = dia.getDay(); // 0 dom
    const alta = esTemporadaAlta(dia);

    let precioNoche;

    if (alta) {
      precioNoche = 150;
    } else {
      if (dow === 5 || dow === 6) { // viernes/sábado
        precioNoche = cabaña === "campanilla" ? 150 : 140;
      } else {
        precioNoche = cabaña === "campanilla" ? 115 : 110;
      }
    }

    total += precioNoche;
  }

  // descuentos
  let descuento = 0;
  const tieneAlta = esTemporadaAlta(fechaEntrada);

  if (tieneAlta && noches >= 6) descuento = total * 0.10;
  if (!tieneAlta && noches >= 3) descuento = total * 0.10;

  total -= descuento;

  // mínima estancia
  const minNoches = tieneAlta ? 4 : 2;
  if (noches < minNoches) {
    alert(`Estancia mínima ${minNoches} noches`);
    return;
  }

  document.getElementById("cabañaSeleccionada").innerText =
    cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";

  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total - 50).toFixed(2);

  document.getElementById("resultado").style.display = "block";
}

// --------------------- RESERVAR ---------------------
function reservar() {
  alert("Aquí conectaremos la pasarela de pago.");
}
