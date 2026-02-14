const TEMPORADA_ALTA = 150;
const TEMPORADA_BAJA = 115;
const FIN_DE_SEMANA = [5, 6]; // viernes=5, sábado=6

function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const navidad = (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7);
  // Aquí puedes añadir semana santa y vísperas de festivos
  return mes === 7 || mes === 8 || navidad;
}

function calcularPrecio(fechaInicioStr, fechaFinStr) {
  let fechaInicio = new Date(fechaInicioStr);
  let fechaFin = new Date(fechaFinStr);
  let total = 0;
  let noches = 0;

  while(fechaInicio < fechaFin) {
    const diaSemana = fechaInicio.getDay(); // 0=domingo, 6=sábado
    let precioDia = esTemporadaAlta(fechaInicio) ? TEMPORADA_ALTA : TEMPORADA_BAJA;

    // Descuento 10% temporada baja si >=3 noches (excepto viernes y sábado)
    if (!esTemporadaAlta(fechaInicio) && noches >= 2 && !FIN_DE_SEMANA.includes(diaSemana)) {
      precioDia *= 0.9;
    }

    total += precioDia;
    noches++;
    fechaInicio.setDate(fechaInicio.getDate() + 1);
  }

  // Descuento temporada alta 10% si 6 o más noches
  if (noches >= 6 && total >= TEMPORADA_ALTA) {
    total *= 0.9;
  }

  return Math.round(total);
}

module.exports = { calcularPrecio };
