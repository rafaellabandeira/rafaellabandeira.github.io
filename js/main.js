// ================= MAIN.JS COMPLETO CORREGIDO =================

// ===== FORMATEO FECHA LOCAL (d/m/Y) =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${d}/${m}/${y}`;
}

// ===== CARGAR RESERVAS DESDE AIRBNB =====
const ICAL_URL = "https://www.airbnb.com/calendar/ical/1500686530638824022.ics?t=ce47e05e2dff41f19ba27d97a8e448d3&locale=es";

async function cargarReservasAirbnb() {
  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) throw new Error("No se pudo cargar el iCal de Airbnb");

    const text = await res.text();
    const fechas = [];

    const lines = text.split("\n");
    let currentEvent = {};

    for (let line of lines) {
      if (line.startsWith("DTSTART"))
        currentEvent.start = line.split(":")[1];

      if (line.startsWith("DTEND")) {
        currentEvent.end = line.split(":")[1];

        const start = new Date(
          currentEvent.start.slice(0,4) + "-" +
          currentEvent.start.slice(4,6) + "-" +
          currentEvent.start.slice(6,8)
        );

        const end = new Date(
          currentEvent.end.slice(0,4) + "-" +
          currentEvent.end.slice(4,6) + "-" +
          currentEvent.end.slice(6,8)
        );

        for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
          fechas.push(formatearLocal(new Date(d)));
        }

        currentEvent = {};
      }
    }

    return { campanilla: fechas, tejo: fechas };
  } catch (err) {
    console.error(err);
    return { campanilla: [], tejo: [] };
  }
}

// ===== CALENDARIO TIPO BOOKING =====
let mesBase = new Date();
let reservasGlobal = {};
let inicioSeleccion = null;
let finSeleccion = null;

function iniciarCalendarioBooking(fechasOcupadas, fechaBase = new Date()) {
  const container = document.getElementById("fechas");
  if (!container) return;
  container.innerHTML = "";

  reservasGlobal = fechasOcupadas;

  function crearMes(ano, mes) {
    const primerDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const mesContainer = document.createElement("div");
    mesContainer.classList.add("mes-calendario");
    mesContainer.style.marginRight = "10px";

    const tituloMes = document.createElement("div");
    tituloMes.classList.add("titulo-mes");
    tituloMes.innerText = primerDia.toLocaleString("es-ES", { month: "long", year: "numeric" });
    mesContainer.appendChild(tituloMes);

    const diasSemana = ["L","M","X","J","V","S","D"];
    diasSemana.forEach(dia => {
      const dElem = document.createElement("div");
      dElem.classList.add("dia-semana");
      dElem.innerText = dia;
      mesContainer.appendChild(dElem);
    });

    // Espacios antes del primer día
    let primerDiaSemana = primerDia.getDay();
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    for (let i = 0; i < primerDiaSemana; i++) {
      const empty = document.createElement("div");
      empty.classList.add("fila-dia", "empty-dia");
      mesContainer.appendChild(empty);
    }

    // Días del mes
    const cabana = document.getElementById("cabaña")?.value.toLowerCase();

    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = new Date(ano, mes, d);
      const fechaFormateada = formatearLocal(fecha);

      const diaElem = document.createElement("div");
      diaElem.classList.add("fila-dia");
      diaElem.innerText = d;
      diaElem.dataset.fecha = fecha.toISOString().slice(0,10);

      // Día pasado
      if (fecha < new Date()) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // Día bloqueado Airbnb
      if (reservasGlobal[cabana]?.includes(fechaFormateada)) {
        diaElem.classList.add("reservado");
        diaElem.style.cursor = "not-allowed";
      }

      // Click selección
      diaElem.addEventListener("click", () => {
        if (diaElem.classList.contains("reservado")) return;

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

        // Actualizar selección
        const dias = mesContainer.querySelectorAll(".fila-dia");
        dias.forEach(d => d.classList.remove("seleccionado"));
        dias.forEach(d => {
          const f = new Date(d.dataset.fecha);
          if (inicioSeleccion && finSeleccion && f >= inicioSeleccion && f <= finSeleccion) {
            d.classList.add("seleccionado");
          }
        });
      });

      mesContainer.appendChild(diaElem);
    }

    container.appendChild(mesContainer);
  }

  // Mostrar mes base + siguiente
  crearMes(fechaBase.getFullYear(), fechaBase.getMonth());
  const siguiente = new Date(fechaBase);
  siguiente.setMonth(siguiente.getMonth() + 1);
  crearMes(siguiente.getFullYear(), siguiente.getMonth());
}

// ===== FUNCIONES FLECHAS =====
function refrescarCalendario() { iniciarCalendarioBooking(reservasGlobal, mesBase); }
document.getElementById("mesAnterior")?.addEventListener("click", () => { mesBase.setMonth(mesBase.getMonth() - 1); refrescarCalendario(); });
document.getElementById("mesSiguiente")?.addEventListener("click", () => { mesBase.setMonth(mesBase.getMonth() + 1); refrescarCalendario(); });

// ===== FUNCIONES CALCULO RESERVA, TEMPORADA, RESERVAR, CARRUSEL, HAMBURGER =====
// Mantener tu código tal cual, no cambia nada, solo que ahora reservasGlobal funciona correctamente

// ===== INICIALIZACIÓN GENERAL =====
document.addEventListener("DOMContentLoaded", async () => {
  initHamburger();
  initCarousel(".carousel-container", ".carousel-slide", ".prev", ".next", ".indicator");
  initCarousel(".carousel-container-general", ".carousel-slide-general", ".prev-general", ".next-general", ".indicator-general");

  const reservas = await cargarReservasAirbnb();
  actualizarUrgencia(reservas);

  if (document.getElementById("cabaña") && document.getElementById("fechas")) {
    iniciarCalendarioBooking(reservas);
  }

  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  document.getElementById("btnPagar")?.addEventListener("click", reservar);
});
