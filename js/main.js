 <!-- Flatpickr Calendario -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

// ===============================
// PRECIOS
// ===============================

const PRECIOS = {
  campanilla: {
    alta: 150,
    baja: 110
  },
  tejo: {
    alta: 140,
    baja: 110
  }
};

// ===============================
// CREAR FECHA LOCAL (EVITA BUG UTC)
// ===============================

function crearFechaLocal(fechaString) {
  const partes = fechaString.split("-");
  return new Date(
    parseInt(partes[0]),
    parseInt(partes[1]) - 1,
    parseInt(partes[2])
  );
}

// ===============================
// SABER SI UNA NOCHE ES TEMPORADA ALTA
// ===============================

function esTemporadaAlta(fecha) {

  const diaSemana = fecha.getDay(); // 0 domingo ... 6 sábado
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();

  const esFinde = (diaSemana === 5 || diaSemana === 6); // viernes o sábado

  const esVerano = (mes === 7 || mes === 8);

  const esNavidad =
    (mes === 12 && dia >= 22) ||
    (mes === 1 && dia <= 7);

  return esFinde || esVerano || esNavidad;
}

// ===============================
// CALCULAR TOTAL POR NOCHE REAL
// ===============================

function calcularTotalEstancia(cabana, fechaEntrada, noches) {

  let total = 0;
  let nochesAlta = 0;
  let nochesBaja = 0;

  for (let i = 0; i < noches; i++) {

    const noche = new Date(
      fechaEntrada.getFullYear(),
      fechaEntrada.getMonth(),
      fechaEntrada.getDate() + i
    );

    if (esTemporadaAlta(noche)) {
      total += PRECIOS[cabana].alta;
      nochesAlta++;
    } else {
      total += PRECIOS[cabana].baja;
      nochesBaja++;
    }
  }

  return { total, nochesAlta, nochesBaja };
}

// ===============================
// CALCULAR Nº DE NOCHES
// ===============================

function calcularNoches(fechaEntrada, fechaSalida) {
  const diff = fechaSalida - fechaEntrada;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ===============================
// FUNCIÓN PRINCIPAL DE RESERVA
// ===============================

function calcularReserva() {

  const cabana = document.querySelector('input[name="cabana"]:checked')?.value;
  const entradaStr = document.getElementById("fechaEntrada").value;
  const salidaStr = document.getElementById("fechaSalida").value;

  if (!cabana || !entradaStr || !salidaStr) return;

  const fechaEntrada = crearFechaLocal(entradaStr);
  const fechaSalida = crearFechaLocal(salidaStr);

  const noches = calcularNoches(fechaEntrada, fechaSalida);

  if (noches <= 0) {
    mostrarResultado("Fechas no válidas");
    return;
  }

  // ===============================
  // COMPROBAR ESTANCIA MÍNIMA
  // ===============================

  let hayAlta = false;

  for (let i = 0; i < noches; i++) {
    const d = new Date(
      fechaEntrada.getFullYear(),
      fechaEntrada.getMonth(),
      fechaEntrada.getDate() + i
    );
    if (esTemporadaAlta(d)) {
      hayAlta = true;
      break;
    }
  }

  const estanciaMinima = hayAlta ? 4 : 2;

  if (noches < estanciaMinima) {
    mostrarResultado(`Estancia mínima: ${estanciaMinima} noches`);
    return;
  }

  // ===============================
  // CALCULAR PRECIO
  // ===============================

  let { total, nochesAlta, nochesBaja } =
    calcularTotalEstancia(cabana, fechaEntrada, noches);

  // ===============================
  // DESCUENTOS
  // ===============================

  if (!hayAlta && noches >= 3) {
    total *= 0.90; // baja 10%
  }

  if (hayAlta && noches > 6) {
    total *= 0.90; // alta 10%
  }

  total = Math.round(total);

  mostrarResultado(`${noches} noches — Total: ${total} €`);
}

// ===============================
// MOSTRAR RESULTADO EN PANTALLA
// ===============================

function mostrarResultado(texto) {
  const div = document.getElementById("resultadoReserva");
  if (div) div.innerText = texto;
}

// ===============================
// EVENTOS
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("fechaEntrada")
    .addEventListener("change", calcularReserva);

  document.getElementById("fechaSalida")
    .addEventListener("change", calcularReserva);

  document.querySelectorAll('input[name="cabana"]')
    .forEach(el => el.addEventListener("change", calcularReserva));

});
