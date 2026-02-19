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
    const cabaña = document.getElementById("cabaña").value.toLowerCase();

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

  const marcarDias = (dayElem) => {
    const cabaña = document.getElementById("cabaña").value.toLowerCase();
    const fecha = dayElem.dateObj.toISOString().split("T")[0];

    // Bloqueamos en rojo solo los días de reserva (entrada + intermedios)
    if (fechasOcupadas[cabaña]?.includes(fecha)) {
      dayElem.classList.add("ocupado");
    }
  };

  const fpConfig = {
    dateFormat: "d-m-Y",   // día-mes-año
    minDate: "today",
    locale: "es",
    firstDayOfWeek: 1,     // lunes
    onChange: actualizarAviso,
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      marcarDias(dayElem);
    }
  };

  flatpickr("#entrada", fpConfig);

  flatpickr("#salida", {
    ...fpConfig,
    onDayCreate: (dObj, dStr, fp, dayElem) => {
      marcarDias(dayElem);
    }
  });
}
