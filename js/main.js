// ===== FORMATEO FECHA LOCAL =====
function formatearLocal(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ===== VARIABLES GLOBALES =====
let reservasGlobal = { campanilla: [], tejo: [], bloqueados: [] };
let mesBase = new Date();
let inicioSeleccion = null;
let finSeleccion = null;
let modoAdmin = false;

// ===== CARGAR Y GUARDAR RESERVAS =====
function cargarReservasLocal() {
  const data = localStorage.getItem("reservasGlobal");
  if (data) {
    reservasGlobal = JSON.parse(data);
    if (!reservasGlobal.bloqueados) reservasGlobal.bloqueados = [];
  }
}

function guardarReservasLocal() {
  localStorage.setItem("reservasGlobal", JSON.stringify(reservasGlobal));
}

// ===== TEMPORADA ALTA =====
function esTemporadaAlta(fecha) {
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return (mes === 7 || mes === 8 || (mes === 12 && dia >= 22) || (mes === 1 && dia <= 7));
}

// ===== SELECCIÓN RANGO =====
function seleccionarFecha(fecha) {
  if (modoAdmin) return;

  const todosDias = document.querySelectorAll(".fila-dia");
  const diaBloqueado = Array.from(todosDias).find(d =>
    new Date(d.dataset.fecha).getTime() === fecha.getTime() &&
    d.classList.contains("reservado")
  );
  if (diaBloqueado) return;

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

  todosDias.forEach(d => d.classList.remove("seleccionado"));

  todosDias.forEach(d => {
    const f = new Date(d.dataset.fecha);
    if (inicioSeleccion && finSeleccion && f >= inicioSeleccion && f <= finSeleccion) {
      if (!d.classList.contains("reservado")) d.classList.add("seleccionado");
    }
  });
}

// ===== GENERAR MES =====
function generarMes(baseDate) {
  const primerDia = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const ultimoDia = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

  const mesContainer = document.createElement("div");
  mesContainer.classList.add("mes-calendario");

  // Barra superior del mes
  const calTop = document.createElement("div");
  calTop.classList.add("cal-top");

  const btnPrev = document.createElement("button");
  btnPrev.classList.add("flecha-mes");
  btnPrev.innerText = "◀";
  btnPrev.addEventListener("click", () => {
    mesBase.setMonth(mesBase.getMonth() - 1);
    iniciarCalendario();
  });

  const titulo = document.createElement("span");
  titulo.id = "tituloMes";
  titulo.innerText = baseDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).toUpperCase();

  const btnNext = document.createElement("button");
  btnNext.classList.add("flecha-mes");
  btnNext.innerText = "▶";
  btnNext.addEventListener("click", () => {
    mesBase.setMonth(mesBase.getMonth() + 1);
    iniciarCalendario();
  });

  calTop.appendChild(btnPrev);
  calTop.appendChild(titulo);
  calTop.appendChild(btnNext);
  mesContainer.appendChild(calTop);

  // Días de la semana
  ["L", "M", "X", "J", "V", "S", "D"].forEach(dia => {
    const dElem = document.createElement("div");
    dElem.classList.add("dia-semana");
    dElem.innerText = dia;
    mesContainer.appendChild(dElem);
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let primerDiaSemana = primerDia.getDay();
  primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

  for (let i = 0; i < primerDiaSemana; i++) {
    const empty = document.createElement("div");
    empty.classList.add("fila-dia", "empty-dia");
    mesContainer.appendChild(empty);
  }

  const cabaña = document.getElementById("cabaña").value;

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
    const diaElem = document.createElement("div");
    diaElem.classList.add("fila-dia");
    diaElem.dataset.fecha = formatearLocal(fecha);
    diaElem.innerText = d;

    if (fecha < hoy) diaElem.classList.add("reservado");
    if (reservasGlobal[cabaña]?.includes(diaElem.dataset.fecha) || reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)) {
      diaElem.classList.add("reservado");
    }

    diaElem.addEventListener("click", () => {
      if (!diaElem.classList.contains("reservado")) seleccionarFecha(fecha);
      else if (modoAdmin) {
        if (reservasGlobal.bloqueados.includes(diaElem.dataset.fecha)) {
          reservasGlobal.bloqueados = reservasGlobal.bloqueados.filter(f => f !== diaElem.dataset.fecha);
        } else {
          reservasGlobal.bloqueados.push(diaElem.dataset.fecha);
        }
        guardarReservasLocal();
        iniciarCalendario();
      }
    });

    mesContainer.appendChild(diaElem);
  }

  return mesContainer;
}

// ===== CALENDARIO PRINCIPAL =====
function iniciarCalendario() {
  const container = document.getElementById("fechas");
  container.innerHTML = "";
  const mesDiv = generarMes(mesBase);
  container.appendChild(mesDiv);
}

// ===== CALCULAR RESERVA =====
function calcularReserva() {
  const cabaña = document.getElementById("cabaña").value;
  const diasSeleccionados = document.querySelectorAll(".fila-dia.seleccionado");

  if (!diasSeleccionados.length) {
    alert("Selecciona un rango de fechas");
    return;
  }

  const bloqueados = Array.from(diasSeleccionados).some(d => d.classList.contains("reservado"));
  if (bloqueados) {
    alert("Algunas de las fechas seleccionadas no están disponibles");
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  if (!nombre || !telefono || !email) {
    alert("Completa todos los datos");
    return;
  }

  let total = 0;
  const fechas = Array.from(diasSeleccionados).map(d => new Date(d.dataset.fecha));
  fechas.sort((a, b) => a - b);

  const fechaEntrada = fechas[0];
  const fechaSalida = new Date(fechas[fechas.length - 1]);
  fechaSalida.setDate(fechaSalida.getDate() + 1);

  const noches = (fechaSalida - fechaEntrada) / (1000 * 60 * 60 * 24);

  for (let i = 0; i < noches; i++) {
    const dia = new Date(fechaEntrada);
    dia.setDate(dia.getDate() + i);
    const dow = dia.getDay();
    let precio;

    if (esTemporadaAlta(dia)) precio = 150;
    else precio = (dow === 5 || dow === 6) ? (cabaña === "campanilla" ? 150 : 140) : (cabaña === "campanilla" ? 115 : 110);

    total += precio;
  }

  let descuento = 0;
  if (noches >= 6 && esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;
  else if (noches >= 3 && !esTemporadaAlta(fechaEntrada)) descuento = total * 0.10;

  total -= descuento;

  const opciones = { day: "numeric", month: "short" };
  document.getElementById("fechasSeleccionadas").innerHTML =
    `📅 ${fechaEntrada.toLocaleDateString("es-ES", opciones)} - ${fechaSalida.toLocaleDateString("es-ES", opciones)}<br>🛏 ${noches} noches`;
  document.getElementById("cabañaSeleccionada").innerText =
    cabaña === "campanilla" ? "Cabaña Campanilla" : "Cabaña El Tejo";
  document.getElementById("total").innerText = total.toFixed(2);
  document.getElementById("descuento").innerText = descuento.toFixed(2);
  document.getElementById("resto").innerText = (total - 50).toFixed(2);
  document.getElementById("resultado").style.display = "block";
}

// ===== ADMIN =====
function iniciarAdmin() {
  const btn = document.getElementById("adminButton");
  btn.addEventListener("click", () => {
    const pwd = prompt("Introduce la contraseña de administración");
    if (pwd === "8111") {
      modoAdmin = !modoAdmin;
      alert(`Modo administrador ${modoAdmin ? "activado" : "desactivado"}`);
      iniciarCalendario();
    } else {
      alert("Contraseña incorrecta");
    }
  });
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  cargarReservasLocal();
  iniciarCalendario();
  document.getElementById("cabaña")?.addEventListener("change", iniciarCalendario);
  document.getElementById("btnCalcular")?.addEventListener("click", calcularReserva);
  iniciarAdmin();
});
