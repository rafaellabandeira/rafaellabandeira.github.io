// js/ical-sync.js

// URL de tu backend que devuelve las reservas sincronizadas
const BACKEND_RESERVAS = "https://tu-backend.onrender.com/reservas"; // Cambia por tu URL

/**
 * Carga las fechas ocupadas desde el backend
 * y devuelve un objeto { campanilla: [], tejo: [] }
 */
export async function cargarReservas() {
  try {
    const res = await fetch(BACKEND_RESERVAS);
    if (!res.ok) throw new Error("No se pudieron cargar las reservas");
    const reservas = await res.json(); // { campanilla: [], tejo: [] }
    return reservas;
  } catch (err) {
    console.error("Error cargando reservas:", err);
    return { campanilla: [], tejo: [] };
  }
}

/**
 * Función para marcar días ocupados y pasados en Flatpickr
 * Se usa desde main.js en iniciarCalendarios()
 */
export function pintarDiasFlatpickr(instance, fechasOcupadas, cabana) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");
  days.forEach(dayElem => {
    const fechaISO = dayElem.dateObj.toISOString().slice(0, 10);

    // Reset estilos
    dayElem.classList.remove("disponible", "ocupado", "pasado");
    dayElem.style.background = "";
    dayElem.style.color = "";
    dayElem.style.pointerEvents = "";

    // Días pasados
    if (dayElem.dateObj < hoy) {
      dayElem.classList.add("pasado");
      dayElem.style.background = "#212121";
      dayElem.style.color = "#fff";
      dayElem.style.pointerEvents = "none";
    }
    // Días ocupados según iCal/backend
    else if (fechasOcupadas[cabana]?.includes(fechaISO)) {
      dayElem.classList.add("ocupado");
      dayElem.style.background = "#e53935";
      dayElem.style.color = "#fff";
      dayElem.style.pointerEvents = "none";
    }
    // Días disponibles
    else {
      dayElem.classList.add("disponible");
      dayElem.style.background = "#e8f5e9";
      dayElem.style.color = "#000";
    }

    dayElem.style.borderRadius = "6px";
  });
}
