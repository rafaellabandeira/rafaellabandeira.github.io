// js/ical-sync.js

// URL de tu backend que devuelve las reservas sincronizadas
const BACKEND_RESERVAS = "https://tu-backend.onrender.com/reservas"; // Cambia por tu URL

/**
 * Carga las fechas ocupadas desde el backend
 * y actualiza el calendario en la página
 */
export async function cargarReservas() {
  try {
    const res = await fetch(BACKEND_RESERVAS);
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    const reservas = await res.json(); // { campanilla: [], tejo: [] }

    // Actualiza los calendarios visibles (si los hay)
    actualizarCalendario("calendario-campanilla", reservas.campanilla);
    actualizarCalendario("calendario-tejo", reservas.tejo);

    // Bloquea fechas en los inputs de reserva
    bloquearFechasInput("entrada", "salida", reservas);

  } catch (err) {
    console.error("Error cargando reservas:", err);
  }
}

/**
 * Marca los días ocupados en el calendario estático
 */
function actualizarCalendario(idElemento, fechasOcupadas) {
  const contenedor = document.getElementById(idElemento);
  if (!contenedor) return;

  // Recorre todos los días del calendario
  const dias = contenedor.querySelectorAll(".dia");
  dias.forEach(d => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1; // Mes actual
    const day = parseInt(d.textContent, 10);
    const fecha = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (fechasOcupadas.includes(fecha)) {
      d.classList.remove("libre");
      d.classList.add("ocupado");
    } else {
      d.classList.remove("ocupado");
      d.classList.add("libre");
    }
  });
}

/**
 * Bloquea automáticamente los días ocupados en los inputs de fecha
 */
function bloquearFechasInput(idEntrada, idSalida, reservas) {
  const entrada = document.getElementById(idEntrada);
  const salida = document.getElementById(idSalida);

  if (!entrada || !salida) return;

  // Cada vez que el usuario elige una fecha de entrada
  entrada.addEventListener("change", () => {
    const cabana = document.getElementById("cabaña").value;
    const fechasOcupadas = reservas[cabana] || [];

    // Deshabilitar manualmente las fechas ocupadas en salida
    salida.setAttribute("min", entrada.value);

    salida.addEventListener("input", () => {
      const selectedDates = generarRangoFechas(entrada.value, salida.value);
      for (const f of selectedDates) {
        if (fechasOcupadas.includes(f)) {
          alert(`La fecha ${f} ya está ocupada, elige otro rango`);
          salida.value = "";
          break;
        }
      }
    });
  });
}

/**
 * Genera un array de fechas entre inicio y fin (inclusive)
 */
function generarRangoFechas(inicio, fin) {
  const fechas = [];
  const start = new Date(inicio);
  const end = new Date(fin);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    fechas.push(d.toISOString().slice(0, 10));
  }
  return fechas;
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarReservas);
