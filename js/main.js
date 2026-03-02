// ===== INICIALIZACIÓN DE CALENDARIO MEJORADO =====
function iniciarCalendarios(fechasOcupadas) {
  const aviso = document.getElementById("avisoFechas");

  function actualizarAviso(selectedDates) {
    const entrada = selectedDates[0];
    const salida = selectedDates[1];
    if (!entrada || !salida) {
      aviso.style.display = "none";
      return;
    }

    const cabana = document.getElementById("cabaña").value.toLowerCase();
    let actual = new Date(entrada);
    const fin = new Date(salida);
    let ocupado = false;

    while (actual < fin) {
      const fechaISO = formatearLocal(actual);
      if (fechasOcupadas[cabana]?.includes(fechaISO)) {
        ocupado = true;
        break;
      }
      actual.setDate(actual.getDate() + 1);
    }

    aviso.style.display = ocupado ? "block" : "none";
  }

  function pintarDias(instance) {
    const cabana = document.getElementById("cabaña").value.toLowerCase();
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const days = instance.calendarContainer.querySelectorAll(".flatpickr-day");
    days.forEach(dayElem => {
      const fechaISO = formatearLocal(dayElem.dateObj);
      dayElem.style.borderRadius = "6px";

      // Días fuera del mes → aplicar estilo suave y seleccionable
      if (dayElem.classList.contains("prevMonthDay") || dayElem.classList.contains("nextMonthDay")) {
        dayElem.style.background = "#f0fdf4";
        dayElem.style.color = "#333";
        dayElem.style.pointerEvents = "";
        return;
      }

      // Días pasados
      if (dayElem.dateObj < hoy) {
        dayElem.style.background = "#212121";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      // Días ocupados
      else if (fechasOcupadas[cabana]?.includes(fechaISO)) {
        dayElem.style.background = "#e53935";
        dayElem.style.color = "#fff";
        dayElem.style.pointerEvents = "none";
      }
      // Días disponibles
      else {
        dayElem.style.background = "#e8f5e9";
        dayElem.style.color = "#000";
        dayElem.style.pointerEvents = "";
      }
    });
  }

  const fpConfig = {
    mode: "single",
    dateFormat: "d/m/Y",
    minDate: "today",
    showDaysInNextAndPreviousMonths: true, // MUY IMPORTANTE
    enable: [date => true],                 // todos los días habilitados
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
        longhand: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
      },
      months: {
        shorthand: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
        longhand: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
      }
    },
    onReady: (selectedDates, dateStr, instance) => pintarDias(instance),
    onMonthChange: (selectedDates, dateStr, instance) => pintarDias(instance),
    onChange: (selectedDates, dateStr, instance) => {
      actualizarAviso(selectedDates);
      pintarDias(instance);
    },
    disable: [
      function(date) {
        const cabana = document.getElementById("cabaña").value.toLowerCase();
        const fechaISO = formatearLocal(date);
        return fechasOcupadas[cabana]?.includes(fechaISO);
      }
    ]
  };

  // Inicializar flatpickr en ambos inputs
  flatpickr("#entrada", fpConfig);
  flatpickr("#salida", fpConfig);

  // Cambiar cabaña actual → repintar calendario
  document.getElementById("cabaña").addEventListener("change", () => {
    const fpEntrada = flatpickr("#entrada");
    const fpSalida = flatpickr("#salida");
    pintarDias(fpEntrada);
    pintarDias(fpSalida);
  });
}
