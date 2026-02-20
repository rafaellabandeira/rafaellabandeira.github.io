// main.js
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js"; // idioma español

// ✅ Formateo en hora LOCAL (evita el bug del día anterior)
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

// --------------------- CALENDARIO ---------------------
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = formatearLocal(actual);
      if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function pintarDias(instance) {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    instance.days.childNodes.forEach(dayElem => {
      if (!dayElem.dateObj) return;

      const fechaISO = formatearLocal(dayElem.dateObj);

      // Reset estilos
      dayElem.style.background = "";
      dayElem.style.color = "";

      // Día pasado → negro
      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }

      // Día reservado → rojo bloqueado
      else if (fechasOcupadas[cabaña]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }

      // Día disponible → verde
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
    locale: { ...Spanish, firstDayOfWeek: 1 },

    disable: [
      function(date) {
        const cabaña = document.getElementById("cabaña").value.toLowerCase();
        const fechaISO = formatearLocal(date);
        return fechasOcupadas[cabaña]?.includes(fechaISO);
      }
    ],

    onReady: (sel, str, instance) => pintarDias(instance),
    onMonthChange: (sel, str, instance) => pintarDias(instance),
    onChange: (sel, str, instance) => {
      actualizarAviso(sel);
      pintarDias(instance);
    }
  };

  const fpEntrada = flatpickr("#entrada", config);
  const fpSalida  = flatpickr("#salida", config);

  // 🔁 Si cambia la cabaña, repintar calendario
  document.getElementById("cabaña").addEventListener("change", () => {
    fpEntrada.redraw();
    fpSalida.redraw();
  });
}
    // Convertir a fecha
    const [d, m, y] = entradaStr.split("/");
    const fechaEntrada = new Date(`${y}-${m}-${d}`);
    const [ds, ms, ys] = salidaStr.split("/");
    const fechaSalida = new Date(`${ys}-${ms}-${ds}`);
    const noches = (fechaSalida - fechaEntrada) / (1000*60*60*24);

    let total = 0, descuento = 0;
    let minNoches = esTemporadaAlta(fechaEntrada) ? 4 : 2;

    // Calcular precio noche por noche
    for (let i=0; i<noches; i++) {
      const dia = new Date(fechaEntrada);
      dia.setDate(dia.getDate() + i);
      const mes = dia.getMonth() + 1;
      const diaNum = dia.getDate();
      const dow = dia.getDay(); // 0-dom, 6-sáb
      let precioNoche;

      const alta = (mes === 7 || mes === 8) || (mes === 12 && diaNum >= 22) || (mes === 1 && diaNum <= 7);

      if (alta) {
        precioNoche = cabaña === "campanilla" ? 150 : 140;
      } else { // temporada baja
        if (dow === 5 || dow === 6) { // viernes o sábado
          precioNoche = cabaña === "campanilla" ? 150 : 140;
        } else {
          precioNoche = cabaña === "campanilla" ? 115 : 110;
        }
      }
      total += precioNoche;
    }

    // Aplicar descuentos
    const tieneAlta = [...Array(noches).keys()].some(i => {
      const dia = new Date(fechaEntrada);
      dia.setDate(dia.getDate() + i);
      return esTemporadaAlta(dia);
    });

    if (tieneAlta && noches >= 6) {
      descuento = total * 0.10;
      total *= 0.90;
    } else if (!tieneAlta && noches >= 3) {
      descuento = total * 0.10;
      total *= 0.90;
    }

    // Verificar mínima estancia
    if (noches < minNoches) {
      alert(`Mínimo ${minNoches} noches en estas fechas`);
      spinner.style.display = "none";
      return;
    }

    // Actualizar HTML
    document.getElementById("cabañaSeleccionada").innerText = cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
    resultado.className = "resumen-reserva " + (cabaña === "campanilla" ? "campanilla" : "tejo");
    document.getElementById("total").innerText = total.toFixed(2);
    document.getElementById("descuento").innerText = descuento.toFixed(2);

    spinner.style.display = "none";
    resultado.style.display = "block";
  }, 300);
}
function reservar() {
  alert("Aquí se conectará el pago de 50 € (Square o pasarela elegida).");
}

// --------------------- UI ---------------------
function initCarousel() {}
function initHamburger() {}
