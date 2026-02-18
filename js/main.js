 <!-- Flatpickr Calendario -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

document.addEventListener("DOMContentLoaded", () => {

  // ---------------- CONFIGURACIÓN ----------------

  const PRECIOS = {
    tejo: {
      baja: 110,
      alta: 140
    },
    acebo: {
      baja: 120,
      alta: 150
    }
  };

  // ---------------- TEMPORADAS ----------------

  function esTemporadaAlta(fecha){
    const f = new Date(fecha);
    const mes = f.getMonth() + 1;
    const dia = f.getDate();

    return (
      mes === 7 ||                      // Julio
      mes === 8 ||                      // Agosto
      (mes === 12 && dia >= 22) ||      // Navidad
      (mes === 1 && dia <= 7)
    );
  }

  // ---------------- FINES DE SEMANA ----------------

  function incluyeFinDeSemana(fechaEntrada, noches){
    for (let i = 0; i < noches; i++) {
      const d = new Date(fechaEntrada);
      d.setDate(d.getDate() + i);

      const diaSemana = d.getDay();

      if (diaSemana === 5 || diaSemana === 6) { // viernes o sábado
        return true;
      }
    }
    return false;
  }

  // ---------------- PRECIO POR NOCHE (LÓGICA FINAL) ----------------

  function obtenerPrecioPorNoche(cabaña, fechaEntrada, noches) {

    let temporadaAlta = false;

    // 1️⃣ Si alguna noche cae en temporada alta real → alta
    for (let i = 0; i < noches; i++) {
      const d = new Date(fechaEntrada);
      d.setDate(d.getDate() + i);

      if (esTemporadaAlta(d)) {
        temporadaAlta = true;
        break;
      }
    }

    // 2️⃣ Si no era alta, mirar si toca viernes/sábado
    if (!temporadaAlta && incluyeFinDeSemana(fechaEntrada, noches)) {
      temporadaAlta = true;
    }

    // 3️⃣ Aplicar precio correcto
    return temporadaAlta
      ? PRECIOS[cabaña].alta
      : PRECIOS[cabaña].baja;
  }

  // ---------------- CÁLCULO DE RESERVA ----------------

  function calcularReserva() {

    const cabaña = document.querySelector("#cabaña").value;
    const entrada = document.querySelector("#entrada").value;
    const salida = document.querySelector("#salida").value;

    if (!entrada || !salida) return;

    const fechaEntrada = new Date(entrada);
    const fechaSalida = new Date(salida);

    const noches = Math.round(
      (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24)
    );

    if (noches <= 0) return;

    const precioNoche = obtenerPrecioPorNoche(cabaña, fechaEntrada, noches);
    let total = precioNoche * noches;

    // ---------------- DESCUENTOS ----------------

    let temporadaAlta = esTemporadaAlta(fechaEntrada) || incluyeFinDeSemana(fechaEntrada, noches);

    if (!temporadaAlta && noches >= 3) {
      total *= 0.90; // 10% descuento temporada baja
    }

    if (temporadaAlta && noches > 6) {
      total *= 0.90; // 10% descuento temporada alta
    }

    // ---------------- MOSTRAR PRECIO ----------------

    document.querySelector("#precio").textContent =
      total.toFixed(2) + " €";
  }

  // ---------------- EVENTOS ----------------

  document.querySelector("#entrada").addEventListener("change", calcularReserva);
  document.querySelector("#salida").addEventListener("change", calcularReserva);
  document.querySelector("#cabaña").addEventListener("change", calcularReserva);

});
